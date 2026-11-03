import crypto from 'crypto';

class ErrorTracker {
  constructor() {
    this.errors = [];
  }

  captureError(error, context = {}) {
    const id = `err_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.errors.push({
      id,
      message: error?.message || String(error),
      context,
      timestamp: new Date().toISOString(),
    });
    return id;
  }

  getStats() {
    return {
      total: this.errors.length,
      recent: this.errors.slice(-10),
    };
  }
}

const errorTracker = new ErrorTracker();
export default errorTracker;
