#!/usr/bin/env node
(async () => {
  const userId = process.argv[2] || '66751804def0b0b1d2f0d672';
  const url = `http://localhost:5000/login/dashboard/get/all/user/${userId}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      console.error('Request failed:', res.status, res.statusText);
      process.exit(2);
    }
    const json = await res.json();
    const payload = json && json.success && Array.isArray(json.data) ? json.data[0] : json;
    if (!payload) {
      console.error('No payload returned');
      process.exit(2);
    }
    if (!('hotelInfo' in payload) || !('hotelCount' in payload)) {
      console.error('FAIL: Missing hotelInfo or hotelCount. Keys:', Object.keys(payload));
      process.exit(1);
    }
    console.log('PASS: hotelInfo and hotelCount present; hotelCount=', payload.hotelCount);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(2);
  }
})();
