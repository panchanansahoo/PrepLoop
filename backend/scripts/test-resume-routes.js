// Test script to verify resume routes load correctly
import('./routes/resume.js')
  .then((module) => {
    console.log('✅ Resume routes loaded successfully');
    console.log('Exported routes:', Object.keys(module));
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to load resume routes:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
