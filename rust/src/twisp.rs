use async_trait::async_trait;
use bytes::{BufMut, Bytes, BytesMut};
use wisp_mux::{
    extensions::{AnyProtocolExtension, ProtocolExtension, ProtocolExtensionBuilder},
    ws::{LockedWebSocketWrite, WebSocketRead},
    WispError,
};

#[derive(Debug)]
pub struct TWispClientProtocolExtension;

impl TWispClientProtocolExtension {
    pub const ID: u8 = 0xF0;
	pub const STREAM_TYPE: u8 = 0x03;
	pub const PACKET_TYPE: u8 = 0xF0;

    pub fn create_resize_request(rows: u16, cols: u16) -> Bytes {
        let mut packet = BytesMut::with_capacity(4);
        packet.put_u16_le(rows);
        packet.put_u16_le(cols);
        packet.freeze()
    }
}

#[async_trait]
impl ProtocolExtension for TWispClientProtocolExtension {
    fn get_id(&self) -> u8 {
        Self::ID
    }

    fn get_supported_packets(&self) -> &'static [u8] {
        &[]
    }

    fn get_congestion_stream_types(&self) -> &'static [u8] {
        &[Self::STREAM_TYPE]
    }

    fn encode(&self) -> Bytes {
        Bytes::new()
    }

    async fn handle_handshake(
        &mut self,
        _: &mut dyn WebSocketRead,
        _: &LockedWebSocketWrite,
    ) -> Result<(), WispError> {
        Ok(())
    }

    async fn handle_packet(
        &mut self,
        _: Bytes,
        _: &mut dyn WebSocketRead,
        _: &LockedWebSocketWrite,
    ) -> Result<(), WispError> {
        Ok(())
    }

    fn box_clone(&self) -> Box<dyn ProtocolExtension + Sync + Send> {
        Box::new(TWispClientProtocolExtension)
    }
}

pub struct TWispClientProtocolExtensionBuilder;

impl ProtocolExtensionBuilder for TWispClientProtocolExtensionBuilder {
    fn get_id(&self) -> u8 {
        TWispClientProtocolExtension::ID
    }

    fn build_from_bytes(
        &mut self,
        _: Bytes,
        _: wisp_mux::Role,
    ) -> Result<AnyProtocolExtension, WispError> {
        Ok(AnyProtocolExtension::new(TWispClientProtocolExtension))
    }

    fn build_to_extension(&mut self, _: wisp_mux::Role) -> Result<AnyProtocolExtension, WispError> {
        Ok(AnyProtocolExtension::new(TWispClientProtocolExtension))
    }
}
