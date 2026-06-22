class RequestBatcher {
  constructor(batchDelay = 50) {
    this.queue = [];
    this.batchDelay = batchDelay;
    this.timer = null;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      
      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  async flush() {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    this.timer = null;

    try {
      const requests = batch.map(({ request }) => request);
      const responses = await Promise.allSettled(
        requests.map(req => req())
      );

      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          batch[index].resolve(result.value);
        } else {
          batch[index].reject(result.reason);
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }
}

export const apiBatcher = new RequestBatcher();
