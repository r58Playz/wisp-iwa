mod twisp;
mod ws_wrapper;

use std::{pin::Pin, sync::Arc};

use anyhow::{anyhow, bail};
use bytes::Bytes;
use ed25519_dalek::pkcs8::DecodePrivateKey;
use futures_util::{
    lock::{Mutex, MutexGuard},
    SinkExt, TryStreamExt,
};
use js_sys::{Function, Object, Reflect, Uint8Array};
use sha2::{Digest, Sha256};
use twisp::{TWispClientProtocolExtension, TWispClientProtocolExtensionBuilder};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{future_to_promise, spawn_local};
use wasm_streams::{ReadableStream, WritableStream};
use wisp_mux::{
    extensions::{
        cert::{CertAuthProtocolExtensionBuilder, SigningKey},
        udp::{UdpProtocolExtension, UdpProtocolExtensionBuilder},
        AnyProtocolExtensionBuilder,
    },
    packet::StreamType,
    stream::MuxStream,
    ws::TransportWrite,
    ClientMux, WispV2Handshake,
};
use ws_wrapper::WebSocketWrapper;

fn jserror(err: anyhow::Error) -> JsError {
    JsError::from(&*err)
}

pub fn object_get(obj: &Object, key: &str) -> Option<JsValue> {
    Reflect::get(obj, &key.into()).ok()
}

pub fn object_set(obj: &Object, key: &JsValue, value: &JsValue) {
    let _ = Reflect::set(obj, key, value);
}

#[wasm_bindgen]
pub struct WispIwa {
    url: String,
    key: Option<SigningKey>,
    mux: Arc<Mutex<Option<ClientMux<Pin<Box<dyn TransportWrite>>>>>>,
    disconnect: Function,
}

#[wasm_bindgen]
impl WispIwa {
    #[wasm_bindgen(js_name = "close")]
    pub async fn close_wbg(&self) -> Result<(), JsError> {
        self.close().await.map_err(jserror)
    }
    async fn close(&self) -> anyhow::Result<()> {
        if let Some(mux) = self.mux.lock().await.as_ref() {
            mux.close().await?;
        }
        Ok(())
    }

    #[wasm_bindgen(js_name = "replace_mux")]
    pub async fn replace_mux_wbg(&self) -> Result<(), JsError> {
        self.replace_mux(self.mux.lock().await)
            .await
            .map_err(jserror)
    }
    async fn replace_mux(
        &self,
        mut locked: MutexGuard<'_, Option<ClientMux<Pin<Box<dyn TransportWrite>>>>>,
    ) -> anyhow::Result<()> {
        let (tx, rx) = WebSocketWrapper::connect(&self.url, &[])?;
        if !tx.wait_for_open().await {
            bail!("ws failed to connect");
        }

        let mut v2 = WispV2Handshake::new(vec![
            AnyProtocolExtensionBuilder::new(UdpProtocolExtensionBuilder),
            AnyProtocolExtensionBuilder::new(TWispClientProtocolExtensionBuilder),
        ]);

        if let Some(key) = self.key.clone() {
            v2.add_extension(AnyProtocolExtensionBuilder::new(
                CertAuthProtocolExtensionBuilder::new_client(Some(key)),
            ));
        }

        let (mux, fut) = ClientMux::new(rx.into_read(), tx.into_write(), Some(v2))
            .await?
            .with_required_extensions(&[UdpProtocolExtension::ID, TWispClientProtocolExtension::ID])
            .await?;

        locked.replace(mux);
        let arc_mux = self.mux.clone();
        let disconnect_handler = self.disconnect.clone();
        spawn_local(async move {
            let ret = fut.await;
            arc_mux.lock().await.take();
            let _ = disconnect_handler.call1(
                &JsValue::UNDEFINED,
                &format!("{:?}", ret).to_string().into(),
            );
        });

        Ok(())
    }

    async fn get_stream(
        &self,
        stream_type: StreamType,
        host: String,
        port: u16,
    ) -> anyhow::Result<MuxStream<Pin<Box<dyn TransportWrite>>>> {
        Box::pin(async {
            let locked = self.mux.lock().await;
            if let Some(mux) = locked.as_ref() {
                let stream = mux.new_stream(stream_type, host, port).await?;
                Ok(stream)
            } else {
                self.replace_mux(locked).await?;
                self.get_stream(stream_type, host, port).await
            }
        })
        .await
    }

    #[wasm_bindgen(js_name = "new_tcp")]
    pub async fn new_tcp_wbg(&self, host: String, port: u16) -> Result<Object, JsError> {
        self.new_tcp(host, port).await.map_err(jserror)
    }
    async fn new_tcp(&self, host: String, port: u16) -> anyhow::Result<Object> {
        let stream = self.get_stream(StreamType::Tcp, host, port).await?;
        let id = stream.get_stream_id();
        let (rx, tx) = stream.into_split();

        let readable = ReadableStream::from_stream(
            rx.map_ok(|x| Uint8Array::from(x.as_ref()).into())
                .map_err(|x| JsError::from(x).into()),
        )
        .into_raw();

        let writable = WritableStream::from_sink(
            tx.with(|x: JsValue| async {
                Ok(Bytes::from(
                    x.dyn_into::<Uint8Array>()
                        .map_err(|_| anyhow!("invalid payload"))?
                        .to_vec(),
                ))
            })
            .sink_map_err(|x: anyhow::Error| JsError::from(&*x).into()),
        )
        .into_raw();

        let obj = Object::new();
        object_set(&obj, &"read".into(), &readable);
        object_set(&obj, &"write".into(), &writable);
        object_set(&obj, &"id".into(), &id.into());

        Ok(obj)
    }

    #[wasm_bindgen(js_name = "new_twisp")]
    pub async fn new_twisp_wbg(&self, term: String) -> Result<Object, JsError> {
        self.new_twisp(term).await.map_err(jserror)
    }
    async fn new_twisp(&self, term: String) -> anyhow::Result<Object> {
        let stream = self
            .get_stream(
                StreamType::Other(TWispClientProtocolExtension::STREAM_TYPE),
                term,
                0,
            )
            .await?;
        let id = stream.get_stream_id();
        let pext_stream = Arc::new(Mutex::new(stream.get_protocol_extension_stream()));
        let (rx, tx) = stream.into_split();

        let readable = ReadableStream::from_stream(
            rx.map_ok(|x| Uint8Array::from(x.as_ref()).into())
                .map_err(|x| JsError::from(x).into()),
        )
        .into_raw();

        let writable = WritableStream::from_sink(
            tx.with(|x: JsValue| async {
                Ok(Bytes::from(
                    x.dyn_into::<Uint8Array>()
                        .map_err(|_| anyhow!("invalid payload"))?
                        .to_vec(),
                ))
            })
            .sink_map_err(|x: anyhow::Error| JsError::from(&*x).into()),
        )
        .into_raw();

        let boxed: Box<dyn Fn(u16, u16) -> JsValue> = Box::new(move |rows: u16, cols: u16| {
            let pext_stream = pext_stream.clone();
            JsValue::from(future_to_promise(async move {
                pext_stream
                    .lock()
                    .await
                    .send(
                        TWispClientProtocolExtension::PACKET_TYPE,
                        TWispClientProtocolExtension::create_resize_request(rows, cols).into(),
                    )
                    .await
                    .map(|_| JsValue::UNDEFINED)
                    .map_err(|x| JsError::from(x).into())
            }))
        });

        let resize = Closure::wrap(boxed);

        let obj = Object::new();
        object_set(&obj, &"read".into(), &readable);
        object_set(&obj, &"write".into(), &writable);
        object_set(
            &obj,
            &"resize".into(),
            &resize.as_ref().unchecked_ref::<Function>().into(),
        );
        object_set(&obj, &"id".into(), &id.into());

        std::mem::forget(resize);
        Ok(obj)
    }

    #[wasm_bindgen(constructor)]
    pub fn new_wbg(url: String, key: String, disconnect: Function) -> Result<WispIwa, JsError> {
        Self::new(url, key, disconnect).map_err(jserror)
    }
    fn new(url: String, key: String, disconnect: Function) -> anyhow::Result<Self> {
        let key = if !key.is_empty() {
            let signer = ed25519_dalek::SigningKey::from_pkcs8_pem(&key)?;
            let binary_key = signer.verifying_key().to_bytes();

            let mut hasher = Sha256::new();
            hasher.update(binary_key);
            let hash: [u8; 32] = hasher.finalize().into();
            Some(SigningKey::new_ed25519(Arc::new(signer), hash))
        } else {
            None
        };

        Ok(Self {
            url,
            key,
            mux: Arc::new(Mutex::new(None)),
            disconnect,
        })
    }
}
