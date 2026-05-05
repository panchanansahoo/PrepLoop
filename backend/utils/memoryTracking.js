/**
 * Memory Usage Tracking for Code Execution
 * Provides sampling-based memory monitoring to minimize overhead
 */

/**
 * Track memory usage during async function execution
 * Samples memory every 50ms and returns statistics
 * @param {Function} asyncFn - Async function to monitor
 * @param {number} maxDuration - Maximum duration to track (ms)
 * @returns {Promise<{peakHeapUsed, avgHeapUsed, samples, maxStack}>}
 */
export async function trackMemoryUsage(asyncFn, maxDuration = 10000) {
  const samples = [];
  const startTime = Date.now();
  const initialMem = process.memoryUsage();

  // Start sampling at 50ms intervals
  const sampleInterval = setInterval(() => {
    const mem = process.memoryUsage();
    samples.push({
      timestamp: Date.now() - startTime,
      heapUsed: mem.heapUsed,
      external: mem.external,
      rss: mem.rss, // Resident set size (total memory)
    });

    // Stop if we've exceeded max duration
    if (Date.now() - startTime > maxDuration) {
      clearInterval(sampleInterval);
    }
  }, 50);

  try {
    // Execute the function being monitored
    const result = await asyncFn();

    // Final memory sample
    const finalMem = process.memoryUsage();
    samples.push({
      timestamp: Date.now() - startTime,
      heapUsed: finalMem.heapUsed,
      external: finalMem.external,
      rss: finalMem.rss,
    });

    clearInterval(sampleInterval);

    // Calculate statistics
    const heapValues = samples.map((s) => s.heapUsed);
    const rssValues = samples.map((s) => s.rss);

    const peakHeapUsed = Math.max(...heapValues);
    const avgHeapUsed = heapValues.length
      ? heapValues.reduce((a, b) => a + b, 0) / heapValues.length
      : 0;
    const peakRss = Math.max(...rssValues);

    return {
      result,
      memory: {
        peakHeapUsed: Math.round(peakHeapUsed / 1024 / 1024 * 100) / 100, // MB
        avgHeapUsed: Math.round(avgHeapUsed / 1024 / 1024 * 100) / 100, // MB
        peakRss: Math.round(peakRss / 1024 / 1024 * 100) / 100, // MB
        sampleCount: samples.length,
        initialHeapUsed: Math.round(initialMem.heapUsed / 1024 / 1024 * 100) / 100,
      },
    };
  } catch (error) {
    clearInterval(sampleInterval);
    throw error;
  }
}

/**
 * Lightweight memory footprint getter (instant, no sampling)
 * Use this for quick memory checks without overhead
 * @returns {{ heapUsed: number, rss: number }}
 */
export function getMemorySnapshot() {
  const mem = process.memoryUsage();
  return {
    heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
    rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
  };
}

/**
 * Estimate memory usage based on output size and complexity
 * Use this as fallback when process.memoryUsage isn't reliable
 * @param {string} output - Code output
 * @param {string} code - Source code length
 * @returns {number} Estimated memory in MB
 */
export function estimateMemoryFromOutput(output = '', codeLength = 0) {
  // Base estimate: ~0.1MB per 100KB of output + code
  const totalSize = output.length + codeLength;
  const estimatedMB = (totalSize / 1024 / 1024) * 0.5 + 5; // 5MB baseline
  return Math.round(estimatedMB * 100) / 100;
}
