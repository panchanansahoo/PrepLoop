/**
 * @validate: structured
 * Script to validate the enhanced profile functionality
 */

// For CommonJS modules, we need to use require
const { normalizeProfileUpdatePayload } = require('../utils/profilePayload.js');

console.log('Testing enhanced profile functionality...');

// Test the normalization function with new fields
const testPayload = {
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  location: 'San Francisco, CA',
  website: 'https://testuser.com',
  company: 'Tech Corp',
  yearsOfExperience: '5 years',
  specialization: 'Frontend Development',
  bio: 'Test bio',
  skills: 'JavaScript, React, Node.js',
  education: 'BS Computer Science',
  socialLinks: {
    twitter: 'testuser',
    linkedin: 'testuser',
    portfolio: 'https://portfolio.testuser.com'
  },
  githubUsername: 'testuser'
};

try {
  const result = normalizeProfileUpdatePayload(testPayload);
  
  console.log('✓ Payload normalization successful');
  console.log('Normalized result keys:', Object.keys(result));
  
  // Verify new fields are present
  const expectedNewFields = [
    'phone', 'location', 'website', 'company', 
    'years_of_experience', 'specialization', 
    'social_links', 'twitter', 'linkedin', 'portfolio'
  ];
  
  const missingFields = expectedNewFields.filter(field => !(field in result));
  
  if (missingFields.length === 0) {
    console.log('✓ All new profile fields are properly handled');
  } else {
    console.log('✗ Missing fields:', missingFields);
    process.exit(1);
  }
  
  // Check if values are properly set
  if (result.phone === '+1234567890') {
    console.log('✓ Phone field properly handled');
  } else {
    console.log('✗ Phone field not properly handled');
    process.exit(1);
  }
  
  if (result.location === 'San Francisco, CA') {
    console.log('✓ Location field properly handled');
  } else {
    console.log('✗ Location field not properly handled');
    process.exit(1);
  }
  
  if (result.social_links && typeof result.social_links === 'object') {
    console.log('✓ Social links properly handled as object');
  } else {
    console.log('✗ Social links not properly handled');
    process.exit(1);
  }
  
  console.log('✓ All validation checks passed');
  process.exit(0);
  
} catch (error) {
  console.error('✗ Error during validation:', error.message);
  process.exit(1);
}