declare module 'ws' {
  export class WebSocketServer {
    constructor(options: any);
    on(event: string, callback: (...args: any[]) => void): void;
    close(callback?: () => void): void;
  }
  export interface WebSocket {
    readyState: number;
    send(data: string | Buffer): void;
    close(code?: number, reason?: string): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }
}
