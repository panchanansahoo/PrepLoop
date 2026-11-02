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

declare module '*/coinTransactions.js' {
  export interface ApplyCoinTransactionParams {
    userId: string;
    amount: number;
    type: 'credit' | 'debit';
    description?: string;
    referenceKey?: string | null;
  }
  export interface ApplyCoinTransactionResult {
    handled: boolean;
    success?: boolean;
    balance?: number;
    error?: any;
    applied?: boolean;
  }
  export function applyCoinTransaction(
    params: ApplyCoinTransactionParams
  ): Promise<ApplyCoinTransactionResult>;
}


