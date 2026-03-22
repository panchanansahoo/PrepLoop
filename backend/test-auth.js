import axios from 'axios';

async function testAuth() {
  try {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const email = `testuser${randomSuffix}@example.com`;
    const password = 'password123';
    
    console.log(`[1] Signing up ${email}...`);
    const signupRes = await axios.post('http://localhost:5000/api/auth/signup', {
      email,
      password,
      fullName: 'Test User'
    });
    console.log('Signup result:', signupRes.data.message);
    
    console.log(`[2] Logging in ${email}...`);
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });
    console.log('Login result:', loginRes.data.message);
    
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAuth();
