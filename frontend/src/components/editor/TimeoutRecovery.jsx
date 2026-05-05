import { useState } from 'react';
import { AlertCircle, RotateCcw, Zap, BarChart3, X } from 'lucide-react';

/**
 * TimeoutRecoveryAlert - Enhanced timeout/error handling with recovery options
 * Displays detailed error diagnostics and allows retry with custom timeout
 */
export function TimeoutRecoveryAlert({
  error,
  diagnostics,
  memory,
  executionTime,
  onRetry,
  onCancel,
  loading = false,
  language = 'javascript',
}) {
  const [customTimeout, setCustomTimeout] = useState(5000);
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const isTimeout = error.includes('timeout') || error.includes('TIMEOUT');
  const isMemory = error.includes('memory') || error.includes('ENOMEM');

  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '12px',
      }}
    >
      {/* ─ Header ─ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <AlertCircle
          size={20}
          style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#fca5a5',
              marginBottom: '4px',
            }}
          >
            {isTimeout
              ? '⏱️ Execution Timeout'
              : isMemory
                ? '💾 Memory Limit'
                : '❌ Execution Error'}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#fecaca',
              lineHeight: '1.5',
            }}
          >
            {error}
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ef4444',
            opacity: 0.6,
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Dismiss"
        >
          <X size={18} />
        </button>
      </div>

      {/* ─ Diagnostics (expandable) ─ */}
      {diagnostics && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '12px',
              color: '#fecaca',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.target.style.background = 'rgba(239, 68, 68, 0.15)')
            }
            onMouseLeave={(e) =>
              (e.target.style.background = 'rgba(239, 68, 68, 0.1)')
            }
          >
            {showDetails ? '▼' : '▶'} Error Details ({diagnostics.category})
          </button>

          {showDetails && (
            <div
              style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                borderLeft: '3px solid rgba(239, 68, 68, 0.3)',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#fecaca',
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <strong>Error Type:</strong> {diagnostics.category.replace(/_/g, ' ')}
              </div>
              {diagnostics.message && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Message:</strong> {diagnostics.message}
                </div>
              )}
              {diagnostics.stackTrace && diagnostics.stackTrace.length > 0 && (
                <div>
                  <strong>Stack Trace:</strong>
                  <div
                    style={{
                      marginTop: '4px',
                      paddingLeft: '8px',
                      borderLeft: '2px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    {diagnostics.stackTrace.slice(0, 5).map((frame, i) => (
                      <div key={i} style={{ marginBottom: '4px', opacity: 0.8 }}>
                        {frame}
                      </div>
                    ))}
                    {diagnostics.stackTrace.length > 5 && (
                      <div style={{ opacity: 0.6, fontSize: '11px' }}>
                        ... and {diagnostics.stackTrace.length - 5} more frames
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─ Execution Stats ─ */}
      {(memory || executionTime) && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px' }}>
          {memory && (
            <>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Memory</div>
                <div
                  style={{
                    color: '#fecaca',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                  }}
                >
                  {memory.heapUsedMB?.toFixed(1)} MB
                </div>
              </div>
              {memory.memoryDelta !== undefined && (
                <div>
                  <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Delta</div>
                  <div
                    style={{
                      color: memory.memoryDelta > 0 ? '#fca5a5' : '#86efac',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                    }}
                  >
                    {memory.memoryDelta > 0 ? '+' : ''}{memory.memoryDelta?.toFixed(2)} MB
                  </div>
                </div>
              )}
            </>
          )}
          {executionTime && (
            <div>
              <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Time</div>
              <div
                style={{
                  color: '#fecaca',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
              >
                {executionTime}ms
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─ Recovery Options ─ */}
      {isTimeout && (
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#cbd5e1',
              marginBottom: '8px',
              fontWeight: '500',
            }}
          >
            🔄 Retry with custom timeout:
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="range"
              min="1000"
              max="30000"
              step="1000"
              value={customTimeout}
              onChange={(e) => setCustomTimeout(Number(e.target.value))}
              style={{
                flex: 1,
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                color: '#cbd5e1',
                fontFamily: 'monospace',
                minWidth: '60px',
              }}
            >
              {customTimeout / 1000}s
            </span>
          </div>
          <button
            onClick={() => onRetry?.(customTimeout)}
            disabled={loading}
            style={{
              marginTop: '8px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <RotateCcw size={14} />
            {loading ? 'Retrying...' : 'Retry with Custom Timeout'}
          </button>
        </div>
      )}

      {/* ─ Recommendations ─ */}
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
        <div style={{ marginBottom: '4px' }}>💡 Suggestions:</div>
        <ul
          style={{
            margin: '4px 0',
            paddingLeft: '20px',
            listStyleType: 'none',
          }}
        >
          {isTimeout && (
            <>
              <li>• Check for infinite loops in your code</li>
              <li>• Optimize algorithm complexity (reduce nested loops)</li>
              <li>• Try increasing timeout with slider above</li>
            </>
          )}
          {isMemory && (
            <>
              <li>• Reduce array/object allocation</li>
              <li>• Use iterative instead of recursive approaches</li>
              <li>• Check for memory leaks or unbounded growth</li>
            </>
          )}
          {!isTimeout && !isMemory && (
            <>
              <li>• Review the error details above</li>
              <li>• Check function/variable definitions</li>
              <li>• Verify correct input format</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

/**
 * ExecutionMetricsDisplay - Shows memory, time, and performance stats
 */
export function ExecutionMetricsDisplay({ memory, executionTime, language, timingBreakdown }) {
  if (!memory && !executionTime && !timingBreakdown) return null;

  return (
    <div
      style={{
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '6px',
        padding: '12px',
        marginTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontSize: '12px',
      }}
    >
      {/* Memory Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {memory?.heapUsedMB !== undefined && (
          <div>
            <div style={{ color: '#6b7280', marginBottom: '2px', fontSize: '11px' }}>
              Heap Used
            </div>
            <div style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: '500' }}>
              {memory.heapUsedMB.toFixed(2)} MB
            </div>
          </div>
        )}

        {memory?.totalMemoryMB !== undefined && (
          <div>
            <div style={{ color: '#6b7280', marginBottom: '2px', fontSize: '11px' }}>
              Total Memory
            </div>
            <div style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: '500' }}>
              {memory.totalMemoryMB.toFixed(2)} MB
            </div>
          </div>
        )}

        {memory?.memoryDelta !== undefined && (
          <div>
            <div style={{ color: '#6b7280', marginBottom: '2px', fontSize: '11px' }}>
              Delta
            </div>
            <div
              style={{
                color: memory.memoryDelta > 0.1 ? '#f59e0b' : '#10b981',
                fontFamily: 'monospace',
                fontWeight: '500',
              }}
            >
              {memory.memoryDelta > 0 ? '+' : ''}{memory.memoryDelta.toFixed(2)} MB
            </div>
          </div>
        )}

        {executionTime !== undefined && (
          <div>
            <div style={{ color: '#6b7280', marginBottom: '2px', fontSize: '11px' }}>
              Execution Time
            </div>
            <div style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: '500' }}>
              {executionTime}ms
            </div>
          </div>
        )}
      </div>

      {/* Timing Breakdown (if available) */}
      {timingBreakdown && (
        <div
          style={{
            borderTop: '1px solid rgba(16, 185, 129, 0.1)',
            paddingTop: '10px',
          }}
        >
          <div style={{ color: '#6b7280', marginBottom: '8px', fontSize: '11px', fontWeight: '600' }}>
            ⏱️ Timing Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
            <div>
              <div style={{ color: '#6b7280', fontSize: '10px' }}>Parse</div>
              <div style={{ color: '#a78bfa', fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                {timingBreakdown.parseMs}ms
              </div>
              <div style={{ color: '#6b7280', fontSize: '10px' }}>
                ({timingBreakdown.parsePercent}%)
              </div>
            </div>

            {timingBreakdown.compilePercent > 0 && (
              <div>
                <div style={{ color: '#6b7280', fontSize: '10px' }}>Compile</div>
                <div style={{ color: '#f59e0b', fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                  {timingBreakdown.compileMs}ms
                </div>
                <div style={{ color: '#6b7280', fontSize: '10px' }}>
                  ({timingBreakdown.compilePercent}%)
                </div>
              </div>
            )}

            <div>
              <div style={{ color: '#6b7280', fontSize: '10px' }}>Execution</div>
              <div style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                {timingBreakdown.runMs}ms
              </div>
              <div style={{ color: '#6b7280', fontSize: '10px' }}>
                ({timingBreakdown.runPercent}%)
              </div>
            </div>
          </div>

          {/* Visual bar showing breakdown */}
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            {timingBreakdown.parsePercent > 0 && (
              <div
                style={{
                  flex: timingBreakdown.parsePercent,
                  backgroundColor: '#a78bfa',
                }}
              />
            )}
            {timingBreakdown.compilePercent > 0 && (
              <div
                style={{
                  flex: timingBreakdown.compilePercent,
                  backgroundColor: '#f59e0b',
                }}
              />
            )}
            {timingBreakdown.runPercent > 0 && (
              <div
                style={{
                  flex: timingBreakdown.runPercent,
                  backgroundColor: '#10b981',
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
