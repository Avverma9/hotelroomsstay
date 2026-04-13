const https = require('https');

const payload = JSON.stringify({ email: 'av95766@gmail.com', password: 'Avverma@1' });
const url = new URL('https://hotelroomsstay.com/api/login/dashboard/user');

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'User-Agent': 'hotelroomsstay-ui-test/1.0'
  },
  timeout: 20000,
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('Body:', body);
    try {
      const parsed = JSON.parse(body);
      console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      // not JSON
    }
    process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 2);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err && err.message ? err.message : err);
  process.exit(2);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});

req.write(payload);
req.end();
