mod twisp;
mod ws_wrapper;

use std::{borrow::Cow, sync::Arc};

use futures_util::lock::Mutex;
use twisp::{TWispClientProtocolExtension, TWispClientProtocolExtensionBuilder};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use wisp_mux::{extensions::AnyProtocolExtensionBuilder, ClientMux, WispV2Extensions};
use ws_wrapper::WebSocketWrapper;

pub struct WispIwa {
    pub url: String,
    mux: Arc<Mutex<Option<ClientMux>>>,
}

impl WispIwa {
    async fn new(url: String) -> anyhow::Result<Self> {
        let (tx, rx) = WebSocketWrapper::connect(&url, &[])?;
        let (mux, fut) = ClientMux::create(
            rx,
            tx,
            Some(WispV2Extensions::new(vec![
                AnyProtocolExtensionBuilder::new(TWispClientProtocolExtensionBuilder),
            ])),
        )
        .await?
        .with_required_extensions(&[TWispClientProtocolExtension::ID])
        .await?;
        spawn_local(async move {
            fut.await;
        });
        Ok(Self { url, mux })
    }
}
