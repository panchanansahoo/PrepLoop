/**
 * Improvement Plan Telemetry Service Extension
 * 
 * Extends InterviewTelemetryService with improvement plan-specific metrics:
 * - Plan generation latency tracking
 * - Cache operation metrics (hit/miss/TTL)
 * - AI recommendation performance
 * - Lazy analysis effectiveness
 * - User engagement metrics
 */

export class ImprovementPlanTelemetryService {
  constructor(redisClient = null, supabaseClient = null) {
    this.redis = redisClient;
    this.supabase = supabaseClient;
    this.metricsBuffer = [];
    this.flushInterval = 10000; // Flush every 10 seconds
    this.maxBufferSize = 100; // Max metrics before force flush
    
    this._startAutoFlush();
  }

  /**
   * Record improvement plan generation metrics
   */
  recordPlanGeneration({
    userId,
    planId,
    duration_ms,
    cache_hit,
    stage = 'generation',
    analysis_areas,
    ai_calls_count,
    ai_fallback_count,
    weakness_areas_analyzed,
    lazy_mode = true,
    timestamp = new Date().toISOString()
  } = {}) {
    const metric = {
      type: 'plan_generation',
      userId,
      planId,
      duration_ms,
      cache_hit,
      stage,
      analysis_areas: Array.isArray(analysis_areas) ? analysis_areas.length : 0,
      ai_calls: ai_calls_count || 0,
      ai_fallbacks: ai_fallback_count || 0,
      areas_analyzed: weakness_areas_analyzed || 0,
      lazy_mode,
      timestamp
    };
    
    this._addMetric(metric);
    return metric;
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation({
    userId,
    operation = 'get', // get, set, delete, invalidate
    cache_type = 'redis', // redis, memory, disk
    key,
    hit = false,
    duration_ms,
    ttl_seconds,
    size_bytes,
    timestamp = new Date().toISOString()
  } = {}) {
    const metric = {
      type: 'cache_operation',
      userId,
      operation,
      cache_type,
      key_pattern: this._anonymizeKey(key),
      hit,
      duration_ms,
      ttl_seconds,
      size_bytes,
      timestamp
    };
    
    this._addMetric(metric);
    return metric;
  }

  /**
   * Record AI API call performance
   */
  recordAICall({
    userId,
    planId,
    ai_provider = 'groq', // groq, openai, etc
    operation = 'recommendation', // recommendation, analysis, summary
    duration_ms,
    tokens_used,
    fallback_used = false,
    success = true,
    error_type = null,
    timestamp = new Date().toISOString()
  } = {}) {
    const metric = {
      type: 'ai_call',
      userId,
      planId,
      ai_provider,
      operation,
      duration_ms,
      tokens: tokens_used || 0,
      fallback: fallback_used,
      success,
      error_type,
      timestamp
    };
    
    this._addMetric(metric);
    return metric;
  }

  /**
   * Record lazy analysis effectiveness
   */
  recordLazyAnalysis({
    userId,
    planId,
    lazy_mode_used = true,
    areas_analyzed,
    areas_skipped,
    estimated_time_saved_ms,
    accuracy_impact_percent,
    timestamp = new Date().toISOString()
  } = {}) {
    const metric = {
      type: 'lazy_analysis',
      userId,
      planId,
      lazy_mode_used,
      analyzed: areas_analyzed || 0,
      skipped: areas_skipped || 0,
      time_saved_ms: estimated_time_saved_ms || 0,
      accuracy_impact: accuracy_impact_percent || 0,
      timestamp
    };
    
    this._addMetric(metric);
    return metric;
  }

  /**
   * Record user engagement with improvement plan
   */
  recordUserEngagement({
    userId,
    planId,
    action = 'view', // view, expand, mark_complete, download, share
    element = null, // section name
    time_on_page_ms,
    scroll_depth_percent,
    timestamp = new Date().toISOString()
  } = {}) {
    const metric = {
      type: 'user_engagement',
      userId,
      planId,
      action,
      element,
      time_ms: time_on_page_ms || 0,
      scroll_depth: scroll_depth_percent || 0,
      timestamp
    };
    
    this._addMetric(metric);
    return metric;
  }

  /**
   * Record error in improvement plan operations
   */
  recordError({
    userId,
    planId,
    error_type = 'unknown',
    operation = null,
    error_message = null,
    stack_trace = null,
    context = {},
    timestamp = new Date().toISOString()
  } = {}) {
    const metric = {
      type: 'error',
      userId,
      planId,
      error_type,
      operation,
      error_message,
      stack_trace: stack_trace ? this._truncateStackTrace(stack_trace) : null,
      context,
      timestamp
    };
    
    this._addMetric(metric);
    return metric;
  }

  /**
   * Get metrics summary for a user
   */
  async getSummary(userId, timeRange = '24h') {
    const metrics = await this._getMetricsFromStorage(userId, timeRange);
    
    return {
      total_operations: metrics.length,
      avg_generation_time: this._calculateAvg(metrics, 'plan_generation', 'duration_ms'),
      cache_hit_rate: this._calculateHitRate(metrics, 'cache_operation'),
      ai_fallback_rate: this._calculateFallbackRate(metrics, 'ai_call'),
      avg_ai_duration: this._calculateAvg(metrics, 'ai_call', 'duration_ms'),
      errors: metrics.filter(m => m.type === 'error').length,
      lazy_mode_effectiveness: this._calculateLazyEffectiveness(metrics)
    };
  }

  /**
   * Get percentile metrics (p50, p95, p99)
   */
  async getPercentiles(userId, metric_type = 'plan_generation', timeRange = '24h') {
    const metrics = await this._getMetricsFromStorage(userId, timeRange);
    const values = metrics
      .filter(m => m.type === metric_type && m.duration_ms)
      .map(m => m.duration_ms)
      .sort((a, b) => a - b);
    
    if (values.length === 0) return null;
    
    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      mean: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      p50: this._percentile(values, 0.5),
      p95: this._percentile(values, 0.95),
      p99: this._percentile(values, 0.99)
    };
  }

  /**
   * Detect anomalies in metrics
   */
  async detectAnomalies(userId, timeRange = '7d') {
    const metrics = await this._getMetricsFromStorage(userId, timeRange);
    const anomalies = [];
    
    // Detect latency spikes
    const latencies = metrics
      .filter(m => m.duration_ms)
      .map(m => m.duration_ms)
      .sort((a, b) => a - b);
    
    if (latencies.length > 10) {
      const mean = latencies.reduce((a, b) => a + b) / latencies.length;
      const stdDev = Math.sqrt(latencies.reduce((sq, n) => sq + Math.pow(n - mean, 2)) / latencies.length);
      
      metrics.forEach(m => {
        if (m.duration_ms && m.duration_ms > mean + (3 * stdDev)) {
          anomalies.push({
            type: 'latency_spike',
            metric: m,
            severity: 'high',
            expected: mean,
            actual: m.duration_ms,
            std_devs: ((m.duration_ms - mean) / stdDev).toFixed(1)
          });
        }
      });
    }
    
    // Detect high error rate
    const errorCount = metrics.filter(m => m.type === 'error').length;
    if (errorCount > 5) {
      anomalies.push({
        type: 'error_spike',
        severity: 'high',
        count: errorCount
      });
    }
    
    // Detect low cache hit rate
    const cacheOps = metrics.filter(m => m.type === 'cache_operation');
    if (cacheOps.length > 10) {
      const hitRate = cacheOps.filter(m => m.hit).length / cacheOps.length;
      if (hitRate < 0.7) {
        anomalies.push({
          type: 'low_cache_hit_rate',
          severity: 'medium',
          actual_rate: hitRate,
          target_rate: 0.8
        });
      }
    }
    
    return anomalies;
  }

  // Private helper methods
  
  _addMetric(metric) {
    this.metricsBuffer.push(metric);
    
    if (this.metricsBuffer.length >= this.maxBufferSize) {
      this._flush();
    }
  }

  async _flush() {
    if (this.metricsBuffer.length === 0) return;
    
    const batch = [...this.metricsBuffer];
    this.metricsBuffer = [];
    
    // Store to database and cache
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('improvement_plan_metrics')
          .insert(batch);
        
        if (error) {
          console.error('Telemetry flush failed:', error);
          // Re-add to buffer on failure
          this.metricsBuffer.unshift(...batch);
        }
      } catch (err) {
        console.error('Telemetry flush error:', err);
        this.metricsBuffer.unshift(...batch);
      }
    }
  }

  _startAutoFlush() {
    this._flushTimer = setInterval(() => this._flush(), this.flushInterval);
  }

  stopAutoFlush() {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
    }
  }

  _anonymizeKey(key) {
    if (!key) return null;
    // Extract pattern, remove sensitive IDs
    return key.replace(/[a-f0-9\-]{36}/g, '{uuid}');
  }

  _truncateStackTrace(trace) {
    if (!trace) return null;
    const lines = trace.split('\n');
    return lines.slice(0, 5).join('\n'); // Keep first 5 lines
  }

  _calculateAvg(metrics, type, field) {
    const values = metrics
      .filter(m => m.type === type && typeof m[field] === 'number')
      .map(m => m[field]);
    
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b) / values.length);
  }

  _calculateHitRate(metrics, type) {
    const ops = metrics.filter(m => m.type === type);
    if (ops.length === 0) return 0;
    
    const hits = ops.filter(m => m.hit).length;
    return Number((hits / ops.length).toFixed(2));
  }

  _calculateFallbackRate(metrics, type) {
    const ops = metrics.filter(m => m.type === type);
    if (ops.length === 0) return 0;
    
    const fallbacks = ops.filter(m => m.fallback).length;
    return Number((fallbacks / ops.length).toFixed(2));
  }

  _calculateLazyEffectiveness(metrics) {
    const lazy = metrics.filter(m => m.type === 'lazy_analysis');
    if (lazy.length === 0) return null;
    
    const timeSaved = lazy.reduce((sum, m) => sum + (m.time_saved_ms || 0), 0);
    const accuracyImpact = lazy.reduce((sum, m) => sum + (m.accuracy_impact || 0), 0) / lazy.length;
    
    return {
      total_time_saved_ms: timeSaved,
      avg_accuracy_impact_percent: Math.round(accuracyImpact),
      effectiveness_ratio: timeSaved > 0 ? (timeSaved / 1000 / lazy.length).toFixed(1) : 0
    };
  }

  _percentile(sorted, p) {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  async _getMetricsFromStorage(userId, timeRange) {
    // TODO: Implement storage query based on timeRange
    // For now, return buffer
    return this.metricsBuffer.filter(m => m.userId === userId);
  }
}

// Export singleton instance
let instance = null;

export function getImprovementPlanTelemetryService(redis = null, supabase = null) {
  if (!instance) {
    instance = new ImprovementPlanTelemetryService(redis, supabase);
  }
  return instance;
}
