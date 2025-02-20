use std::{
    pin::Pin,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
};

use anyhow::{anyhow, Context};
use event_listener::Event;
use flume::Receiver;
use futures_util::FutureExt;
use js_sys::{Array, ArrayBuffer, Uint8Array};
use send_wrapper::SendWrapper;
use thiserror::Error;
use wasm_bindgen::{closure::Closure, JsCast, JsValue};
use web_sys::{BinaryType, MessageEvent, WebSocket};
use wisp_mux::{
    ws::{
        async_iterator_transport_read, async_iterator_transport_write, Payload, TransportRead,
        TransportWrite,
    },
    WispError,
};

#[derive(Error, Debug)]
pub enum WebSocketError {
    #[error("Unknown JS WebSocket wrapper error: {0:?}")]
    Unknown(String),
    #[error("Failed to call WebSocket.send: {0:?}")]
    SendFailed(String),
    #[error("Failed to call WebSocket.close: {0:?}")]
    CloseFailed(String),
}

impl From<WebSocketError> for WispError {
    fn from(err: WebSocketError) -> Self {
        Self::WsImplError(Box::new(err))
    }
}

pub enum WebSocketMessage {
    Error(WebSocketError),
    Message(Vec<u8>),
}

pub struct WebSocketWrapper {
    pub inner: Arc<SendWrapper<WebSocket>>,
    open_event: Arc<Event>,
    error_event: Arc<Event>,
    close_event: Arc<Event>,
    closed: Arc<AtomicBool>,

    // used to retain the closures
    #[allow(dead_code)]
    onopen: SendWrapper<Closure<dyn Fn()>>,
    #[allow(dead_code)]
    onclose: SendWrapper<Closure<dyn Fn()>>,
    #[allow(dead_code)]
    onerror: SendWrapper<Closure<dyn Fn(JsValue)>>,
    #[allow(dead_code)]
    onmessage: SendWrapper<Closure<dyn Fn(MessageEvent)>>,
}

pub struct WebSocketReader {
    read_rx: Receiver<WebSocketMessage>,
    closed: Arc<AtomicBool>,
    close_event: Arc<Event>,
}

impl WebSocketReader {
    pub fn into_read(self) -> Pin<Box<dyn TransportRead>> {
        Box::pin(async_iterator_transport_read(self, |this| {
            Box::pin(async {
                use WebSocketMessage as M;
                if this.closed.load(Ordering::Acquire) {
                    return Err(WispError::WsImplSocketClosed);
                }

                let res = futures_util::select! {
                    data = this.read_rx.recv_async() => data.ok(),
                    () = this.close_event.listen().fuse() => None
                };

                match res {
                    Some(M::Message(x)) => Ok(Some((Payload::from(x), this))),
                    Some(M::Error(x)) => Err(x.into()),
                    None => Ok(None),
                }
            })
        }))
    }
}

impl WebSocketWrapper {
    pub fn connect(url: &str, protocols: &[String]) -> anyhow::Result<(Self, WebSocketReader)> {
        let (read_tx, read_rx) = flume::unbounded();
        let closed = Arc::new(AtomicBool::new(false));

        let open_event = Arc::new(Event::new());
        let close_event = Arc::new(Event::new());
        let error_event = Arc::new(Event::new());

        let onopen_event = open_event.clone();
        let onopen = Closure::wrap(
            Box::new(move || while onopen_event.notify(usize::MAX) == 0 {}) as Box<dyn Fn()>,
        );

        let onmessage_tx = read_tx.clone();
        let onmessage = Closure::wrap(Box::new(move |evt: MessageEvent| {
            if let Ok(arr) = evt.data().dyn_into::<ArrayBuffer>() {
                let _ =
                    onmessage_tx.send(WebSocketMessage::Message(Uint8Array::new(&arr).to_vec()));
            }
        }) as Box<dyn Fn(MessageEvent)>);

        let onclose_closed = closed.clone();
        let onclose_event = close_event.clone();
        let onclose = Closure::wrap(Box::new(move || {
            onclose_closed.store(true, Ordering::Release);
            onclose_event.notify(usize::MAX);
        }) as Box<dyn Fn()>);

        let onerror_tx = read_tx.clone();
        let onerror_closed = closed.clone();
        let onerror_close = close_event.clone();
        let onerror_event = error_event.clone();
        let onerror = Closure::wrap(Box::new(move |e| {
            let _ = onerror_tx.send(WebSocketMessage::Error(WebSocketError::Unknown(format!(
                "{e:?}"
            ))));
            onerror_closed.store(true, Ordering::Release);
            onerror_close.notify(usize::MAX);
            onerror_event.notify(usize::MAX);
        }) as Box<dyn Fn(JsValue)>);

        let ws = if protocols.is_empty() {
            WebSocket::new(url)
        } else {
            WebSocket::new_with_str_sequence(
                url,
                &protocols
                    .iter()
                    .fold(Array::new(), |acc, x| {
                        acc.push(&x.into());
                        acc
                    })
                    .into(),
            )
        }
        .map_err(|x| anyhow!("{:?}", x))
        .context("failed to connect to ws")?;

        ws.set_binary_type(BinaryType::Arraybuffer);
        ws.set_onmessage(Some(onmessage.as_ref().unchecked_ref()));
        ws.set_onopen(Some(onopen.as_ref().unchecked_ref()));
        ws.set_onclose(Some(onclose.as_ref().unchecked_ref()));
        ws.set_onerror(Some(onerror.as_ref().unchecked_ref()));

        Ok((
            Self {
                inner: Arc::new(SendWrapper::new(ws)),
                open_event,
                error_event,
                close_event: close_event.clone(),
                closed: closed.clone(),
                onopen: SendWrapper::new(onopen),
                onclose: SendWrapper::new(onclose),
                onerror: SendWrapper::new(onerror),
                onmessage: SendWrapper::new(onmessage),
            },
            WebSocketReader {
                read_rx,
                closed,
                close_event,
            },
        ))
    }

    pub async fn wait_for_open(&self) -> bool {
        if self.closed.load(Ordering::Acquire) {
            return false;
        }
        futures_util::select! {
            () = self.open_event.listen().fuse() => true,
            () = self.error_event.listen().fuse() => false,
        }
    }

    pub fn into_write(self) -> Pin<Box<dyn TransportWrite>> {
        let ws = self.inner.clone();
        let closed = self.closed.clone();
        let close_event = self.close_event.clone();
        Box::pin(async_iterator_transport_write(
            self,
            |this, item| {
                Box::pin(async move {
                    this.inner
                        .send_with_u8_array(&item)
                        .map_err(|x| WebSocketError::SendFailed(format!("{x:?}").into()))?;
                    Ok(this)
                })
            },
            (ws, closed, close_event),
            |(ws, closed, close_event)| {
                Box::pin(async move {
                    ws.set_onopen(None);
                    ws.set_onclose(None);
                    ws.set_onerror(None);
                    ws.set_onmessage(None);
                    closed.store(true, Ordering::Release);
                    close_event.notify(usize::MAX);

                    ws.close()
                        .map_err(|x| WebSocketError::CloseFailed(format!("{:?}", x)).into())
                })
            },
        ))
    }
}
