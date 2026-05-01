# Cache Manager Initialization - Error Handling & Graceful Shutdown

## Problem

The `cacheManager.connect()` initialization was happening at the top level of `backend/index.js` (line 40) **before** the async `initializeServer()` function, and **before** process error handlers were registered (lines 357-379).

### Issues with Original Code

```javascript
// Line 40 - Top level, no error handling
await cacheManager.connect();

// Lines 357-379 - Process handlers registered AFTER this
process.on('unhandledRejection', ...);
process.on('uncaughtException', ...);

// Lines 380+ - initializeServer() called and executed
initializeServer().then(() => { ... });
```

**Why this is problematic:**

1. **No Error Handling**: If `cacheManager.connect()` fails, there's no try/catch to handle it gracefully
2. **Process Handlers Not Ready**: Process error handlers are registered AFTER the cache manager tries to connect
3. **Mixed Concerns**: Cache initialization is mixed with other startup logic
4. **Poor Separation**: Error handling and initialization are in different parts of the file

## Solution

Moved `cacheManager.connect()` **into the `initializeServer()` try/catch block** so it benefits from:
- ✅ Proper error handling with try/catch
- ✅ Consistent error reporting
- ✅ Integration with existing initialization flow
- ✅ Clean separation of concerns

### Code Changes

**Before:**
```javascript
// Line 40 - Top level, exposed
await cacheManager.connect();

async function initializeServer() {
  try {
    // Initialize Application Insights...
    // Load routes...
    // Setup Express app...
  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    process.exit(1);
  }
}
```

**After:**
```javascript
async function initializeServer() {
  try {
    // Initialize cache manager with error handling
    console.log('🔄 Initializing cache manager...');
    await cacheManager.connect();
    console.log('✅ Cache manager connected');

    // Initialize Application Insights...
    // Load routes...
    // Setup Express app...
  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}
```

## Benefits

### 1. **Proper Error Handling**
Cache initialization errors are caught by the same try/catch that handles all other initialization errors.

**If cache connection fails:**
```
🔄 Initializing cache manager...
❌ Failed to initialize server: ECONNREFUSED
❌ error stack trace
Process exits with code 1
```

### 2. **Unified Error Reporting**
All initialization errors use the same error message format and stack trace logging.

### 3. **Graceful Degradation**
Error handling is now consistent with:
- Application Insights initialization (non-blocking)
- Route loading (critical)
- Express app setup (critical)

### 4. **Process Error Handlers Active**
Process-level error handlers (`unhandledRejection`, `uncaughtException`) are registered BEFORE the promise chain that starts the server.

### 5. **Clean Code Structure**
```
Startup Order:
1. Environment validation
2. Define initializeServer() [with cache + app setup]
3. Define startServer()
4. Register process handlers
5. Call initializeServer() → startServer() → gracefulShutdown()
```

## Error Handling Flow

### Success Path
```
validateEnvironment()
  ↓
initializeServer()
  ├─ cacheManager.connect() ✓
  ├─ Load routes ✓
  ├─ Setup Express app ✓
  └─ Return
    ↓
startServer(port) ✓
  ↓
setupGracefulShutdown() ✓
  ↓
Server running
```

### Failure Path (Cache Error)
```
validateEnvironment()
  ↓
initializeServer()
  ├─ cacheManager.connect() ✗
  │   └─ Error caught
  ├─ Catch block executes
  │   ├─ Log error message
  │   ├─ Log stack trace
  │   └─ process.exit(1)
  └─ [Promise rejected]
    ↓
.catch() handler
  ├─ Log "Failed to start server"
  └─ process.exit(1) [already exited]
```

## Cache Manager Connection

The cache manager is initialized early because:
- **API cache middleware** (line 176 in index.js) depends on it
- **Cache hits** bypass rate limiting and should work from startup
- **Early initialization** prevents late-binding errors

## Logging

The fix adds two log messages for visibility:

```javascript
console.log('🔄 Initializing cache manager...');
await cacheManager.connect();
console.log('✅ Cache manager connected');
```

This makes the startup sequence clearer:
```
🔄 Initializing cache manager...
✅ Cache manager connected
📦 Loading routes...
✅ Routes loaded successfully
🚀 Server running on http://localhost:5000
```

## Process Error Handlers

Process-level error handlers are now registered **before** the main initialization:

```javascript
// Lines 357-379: Process handlers registered here
process.on('unhandledRejection', ...);
process.on('uncaughtException', ...);

// Lines 381+: Then initialization starts
initializeServer().then(...)
```

This ensures:
1. ✅ Unhandled rejections during cache setup are caught
2. ✅ Uncaught exceptions during cache setup are caught
3. ✅ Graceful shutdown handlers available for any error scenario

## Error Stack Traces

The error handler now includes full stack traces:

**Before:**
```javascript
catch ((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});
```

**After:**
```javascript
catch ((error) => {
  console.error('❌ Failed to start server:', error.message);
  console.error(error.stack);
  process.exit(1);
});
```

## Graceful Shutdown

The graceful shutdown setup still runs AFTER the server starts, but now:
- Cache manager is guaranteed to be initialized or failed
- All initialization errors are handled before server starts
- Shutdown handlers can safely assume cache is available

```javascript
initializeServer()  // Cache initialized here
  .then(() => {
    const server = startServer(port);
    
    // By this point, cache is connected
    // Safe to setup shutdown handlers that depend on cache
    setupGracefulShutdown(server, options);
  })
  .catch(error => {
    // If cache fails, we don't even try to start the server
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
```

## Testing

All existing tests pass without modification:
- ✓ Startup tests
- ✓ Route tests
- ✓ Cache tests
- ✓ Integration tests

The change is purely structural - the behavior remains the same.

## Files Changed

**backend/index.js:**
- Lines 39-47: Moved `cacheManager.connect()` into `initializeServer()` try block
- Lines 410-412: Added error stack trace logging in catch handler

## Configuration

No environment variables changed. Cache configuration remains:
```bash
# Redis cache (optional)
REDIS_URL="redis://localhost:6379"

# Cache TTL (optional)
CACHE_TTL=3600
```

## Related Code

- `backend/utils/cacheManager.js` - Cache connection logic
- `backend/middleware/apiCache.js` - Cache middleware that depends on manager
- `backend/utils/gracefulShutdown.js` - Shutdown handler
- `backend/index.js` - Main application bootstrap

## FAQ

**Q: Why not wrap top-level await in try/catch?**
A: Top-level await is harder to debug and doesn't integrate with the existing initialization flow. Moving it into the async function is cleaner.

**Q: What if cache isn't critical?**
A: The current code treats it as critical (exit if it fails). If you want optional cache, modify the catch block to log a warning instead of exiting.

**Q: Does this affect cache behavior?**
A: No. The cache still connects before routes are registered and the server starts. Only the error handling is improved.

**Q: What about cache initialization order?**
A: Cache connects before other initialization:
1. Environment validation
2. Cache connection
3. Route loading
4. App setup
5. Server startup

**Q: Can I make cache optional?**
A: Yes, modify the catch block:
```javascript
try {
  await cacheManager.connect();
} catch (err) {
  console.warn('⚠️ Cache connection failed, continuing without cache:', err.message);
  // Continue anyway
}
```

## Deployment Notes

- ✅ No breaking changes to API or configuration
- ✅ Better error messages on cache failure
- ✅ Cleaner startup sequence
- ✅ All tests pass

## Summary

This fix improves the robustness of cache manager initialization by:
1. Moving it into the try/catch block with other initialization code
2. Adding proper error logging and stack traces
3. Ensuring process handlers are registered before initialization starts
4. Maintaining the same behavior for successful connections
5. Improving error messages for failed connections
