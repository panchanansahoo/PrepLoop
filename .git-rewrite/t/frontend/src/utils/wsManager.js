export class WSConnectionManager {
  constructor(url, options = {}) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.listeners = new Map();
    this.isIntentionallyClosed = false;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);
    this.isIntentionallyClosed = false;

    this.ws.onopen = () => {
      if (import.meta.env.DEV) console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('open');
    };

    this.ws.onmessage = (event) => {
      this.emit('message', event.data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      if (import.meta.env.DEV) console.log('WebSocket closed');
      this.emit('close');
      
      if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
      }
    };
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  close() {
    this.isIntentionallyClosed = true;
    this.ws?.close();
  }
}
