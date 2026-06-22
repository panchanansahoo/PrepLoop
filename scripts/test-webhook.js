import crypto from 'crypto';

async function testWebhook() {
  const secret = '10042001@Sb';
  const payload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test123',
          order_id: 'order_test123',
          amount: 9900,
          status: 'captured'
        }
      }
    }
  };

  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  console.log('Sending webhook with signature:', signature);

  try {
    const res = await fetch('http://localhost:5000/api/payment/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: body
    });

    const responseText = await res.text();
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body: ${responseText}`);
  } catch (err) {
    console.error('Error sending webhook:', err);
  }
}

testWebhook();
