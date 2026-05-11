import fetch from 'node-fetch';

async function testForgotPassword() {
  try {
    console.log('📧 Testing forgot-password endpoint...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        captchaToken: 'test-token-dummy'
      })
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testForgotPassword();
