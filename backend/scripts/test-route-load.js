/**
 * Quick diagnostic for fresher-interview route
 */

async function testRouteLoad() {
  try {
    console.log('Testing fresher-interview route import...');
    const route = await import('./routes/fresher-interview.js');
    console.log('✅ Route loaded successfully');
    console.log('Route type:', typeof route.default);
    console.log('Route stack:', route.default?.stack?.length || 0, 'endpoints');
  } catch (error) {
    console.error('❌ Failed to load route:', error.message);
    console.error(error.stack);
  }
}

testRouteLoad();
