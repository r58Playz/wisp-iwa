/* https://wicg.github.io/direct-sockets/#dom-tcpsocketoptions */
interface TCPSocketOptions {
  sendBufferSize?: number;
  receiveBufferSize?: number;

  noDelay?: boolean;
  keepAliveDelay?: number;
}

/* https://wicg.github.io/direct-sockets/#dom-tcpsocketopeninfo */
interface TCPSocketOpenInfo {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;

  remoteAddress: string;
  remotePort: number;

  localAddress: string;
  localPort: number;
}

/**
 * https://wicg.github.io/direct-sockets/#dom-tcpsocket
 */
declare class TCPSocket {
  constructor(
    remoteAddress: string,
    remotePort: number,
    options?: TCPSocketOptions,
  );

  opened: Promise<TCPSocketOpenInfo>;
  closed: Promise<void>;

  close(): Promise<void>;
}

/* https://wicg.github.io/direct-sockets/#dom-tcpserversocketoptions */
interface TCPServerSocketOptions {
  localPort?: number;
  backlog?: number;

  ipv6Only?: boolean;
}

/* https://wicg.github.io/direct-sockets/#dom-tcpserversocketopeninfo */
interface TCPServerSocketOpenInfo {
  readable: ReadableStream<TCPSocket>;

  localAddress: string;
  localPort: number;
}

/**
 * https://wicg.github.io/direct-sockets/#dom-tcpserversocket
 */
declare class TCPServerSocket {
  constructor(localAddress: string, options?: TCPServerSocketOptions);

  opened: Promise<TCPServerSocketOpenInfo>;
  closed: Promise<void>;

  close(): Promise<void>;
}
