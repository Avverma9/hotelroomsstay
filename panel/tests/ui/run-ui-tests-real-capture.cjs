const puppeteer = require('puppeteer');

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoWithRetries(page, url, retries = 20, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      return;
    } catch (e) {
      console.log(`Waiting for ${url} (${i + 1}/${retries})`);
      await sleep(delay);
    }
  }
  throw new Error('Failed to reach ' + url);
}

(async () => {
  const API_BASE = process.env.API_BASE || 'https://hotelroomsstay.com/api';
  const EMAIL = process.env.EMAIL || 'Av95766@gmail.com';
  const PASS = process.env.PASSWORD || 'Avverma@1';
  const PANEL_URL = process.env.PANEL_URL || 'http://localhost:5174/admin-new-hotel';
  const FRONT_URL = process.env.FRONT_URL || 'http://localhost:5173/partner';

  console.log('Logging in to API at', API_BASE + '/login/dashboard/user');
  let loginJson;
  try {
    const resp = await fetch(`${API_BASE}/login/dashboard/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASS }),
    });
    const text = await resp.text();
    try { loginJson = JSON.parse(text); } catch (e) { throw new Error('Login response not JSON: ' + text); }
    if (!resp.ok) {
      console.error('Login failed:', resp.status, text);
      process.exit(2);
    }
  } catch (err) {
    console.error('Login request failed:', err);
    process.exit(2);
  }

  const hrsadmin = {
    user: loginJson.sessionData?.user || null,
    role: loginJson.loggedUserRole || (loginJson.sessionData && loginJson.sessionData.user && loginJson.sessionData.user.role) || '',
    token: loginJson.rsToken || (loginJson.sessionData && loginJson.sessionData.token) || '',
    sidebarLinks: loginJson.sidebarLinks || {},
    sessionData: loginJson.sessionData || null,
  };

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const captured = { responses: [] };

  page.on('response', async (res) => {
    try {
      const url = res.url();
      if (url.includes('/data/hotels-new/post/upload/data') || url.includes('/login/dashboard/user') || url.includes('/create-a-room-to-your-hotel') || url.includes('/create-a-amenities')) {
        const text = await res.text();
        const entry = { url, status: res.status(), body: text };
        console.log('CAPTURED RESPONSE:', url, 'status', res.status());
        // only print a truncated body to avoid huge logs
        console.log('BODY:', (text && text.length > 2000) ? text.slice(0,2000) + '...[truncated]' : text);
        captured.responses.push(entry);
      }
    } catch (e) {
      console.error('Error reading response:', e);
    }
  });

  await page.evaluateOnNewDocument((hrsadminObj, rsToken, loggedUserId, userEmail, userName) => {
    try {
      localStorage.setItem('hrsadmin_session', JSON.stringify(hrsadminObj));
      if (rsToken) localStorage.setItem('rsToken', rsToken);
      if (loggedUserId) localStorage.setItem('rsUserId', String(loggedUserId));
      if (userEmail) localStorage.setItem('roomsstayUserEmail', userEmail);
      if (userName) localStorage.setItem('rsUserName', userName);
      localStorage.setItem('isSignedIn', 'true');
      if (rsToken) localStorage.setItem('authToken', rsToken);
    } catch (e) {}
  }, hrsadmin, loginJson.rsToken, loginJson.loggedUserId || (loginJson.sessionData && (loginJson.sessionData.user?.id || loginJson.sessionData.user?._id)), loginJson.loggedUserEmail || (loginJson.sessionData && loginJson.sessionData.user?.email), loginJson.loggedUserName || (loginJson.sessionData && loginJson.sessionData.user?.name));

  try {
    console.log('--- Panel: visiting', PANEL_URL, '---');
    await gotoWithRetries(page, PANEL_URL);
    await sleep(800);

    // Fill minimal fields to trigger create
    await page.evaluate(() => {
      try {
        const setIfEmpty = (selector, value) => {
          const el = document.querySelector(selector);
          if (el && !el.value) { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }
        };
        setIfEmpty('input[placeholder="Hotel Name"], input[name*="hotelName"], input[aria-label*="hotel name"]', 'Capture Test Hotel');
        const txts = Array.from(document.querySelectorAll('input, textarea'));
        for (const t of txts) { if (!t.value) { t.value = t.type === 'email' ? 'av95766@gmail.com' : 'Test'; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true })); } }
      } catch (e) {}
    });

    // Click through steps until Register/Finalize
    const findAndClick = async (page, text) => {
      const handle = await page.evaluateHandle((t) => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) { if ((b.innerText || '').includes(t)) return b; }
        return null;
      }, text);
      const el = handle.asElement ? handle.asElement() : null;
      if (el) { await el.click(); await sleep(800); return true; }
      return false;
    };

    for (let i = 0; i < 12; i++) {
      if (await findAndClick(page, 'Register') || await findAndClick(page, 'Registering')) break;
      if (await findAndClick(page, 'Next Step') || await findAndClick(page, 'Continue to')) continue;
      await sleep(500);
    }

    await sleep(2000);

    // Front test
    console.log('--- Front: visiting', FRONT_URL, '---');
    const page2 = await browser.newPage();
    page2.on('response', async (res) => {
      try {
        const url = res.url();
        if (url.includes('/data/hotels-new/post/upload/data') || url.includes('/login/dashboard/user')) {
          const text = await res.text();
          console.log('CAPTURED RESPONSE (front):', url, 'status', res.status());
          console.log('BODY:', (text && text.length > 2000) ? text.slice(0,2000) + '...[truncated]' : text);
          captured.responses.push({ url, status: res.status(), body: text });
        }
      } catch (e) {}
    });

    await page2.evaluateOnNewDocument((hrsadminObj, rsToken, loggedUserId, userEmail, userName) => {
      try {
        localStorage.setItem('hrsadmin_session', JSON.stringify(hrsadminObj));
        if (rsToken) localStorage.setItem('rsToken', rsToken);
        if (loggedUserId) localStorage.setItem('rsUserId', String(loggedUserId));
        if (userEmail) localStorage.setItem('roomsstayUserEmail', userEmail);
        if (userName) localStorage.setItem('rsUserName', userName);
        localStorage.setItem('isSignedIn', 'true');
        if (rsToken) localStorage.setItem('authToken', rsToken);
      } catch (e) {}
    }, hrsadmin, loginJson.rsToken, loginJson.loggedUserId || (loginJson.sessionData && (loginJson.sessionData.user?.id || loginJson.sessionData.user?._id)), loginJson.loggedUserEmail || (loginJson.sessionData && loginJson.sessionData.user?.email), loginJson.loggedUserName || (loginJson.sessionData && loginJson.sessionData.user?.name));

    await gotoWithRetries(page2, FRONT_URL);
    await sleep(800);

    // Attempt to fill and navigate
    for (let step = 0; step < 12; step++) {
      await page2.evaluate(() => {
        try {
          const candidates = Array.from(document.querySelectorAll('input, textarea, select'))
            .filter(el => el.offsetParent !== null && !el.disabled);
          for (const el of candidates) {
            const tag = el.tagName.toLowerCase();
            const type = el.type || '';
            if (tag === 'select') {
              if (!el.value) { const opt = Array.from(el.options).find(o => o.value); if (opt) el.value = opt.value; }
            } else if (type === 'number') { if (!el.value) el.value = '1'; }
            else if (type === 'email') { if (!el.value) el.value = 'av95766@gmail.com'; }
            else if (type === 'tel') { if (!el.value) el.value = '9999999999'; }
            else { if (!el.value) el.value = 'Test'; }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } catch (e) {}
      });

      const didRegister = await page2.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('register'));
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (didRegister) break;

      const didNext = await page2.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Next Step'));
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!didNext) break;
      await sleep(800);
    }

    await sleep(2000);

    console.log('Captured responses summary:', captured.responses.map(r => ({ url: r.url, status: r.status })));

    // Try to find a hotelId in captured bodies
    const createResp = captured.responses.find(r => r.url.includes('/data/hotels-new/post/upload/data'));
    if (createResp) {
      try {
        const parsed = JSON.parse(createResp.body);
        console.log('Parsed create response:', parsed);
        const hotelId = parsed?.data?.hotelId || parsed?.data?._id || null;
        if (hotelId) {
          console.log('Found hotelId:', hotelId);
          // verify via GET
          try {
            const verifyResp = await fetch(`${API_BASE}/hotels/get-by-id/${hotelId}`);
            const vt = await verifyResp.text();
            console.log('Verify GET status:', verifyResp.status, 'body:', vt.slice(0,2000));
          } catch (e) { console.error('Error verifying hotel GET:', e); }
        }
      } catch (e) { console.error('Error parsing create response body:', e); }
    } else {
      console.log('No create-hotel response captured.');
    }

    console.log('\nReal-capture UI tests completed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Real-capture UI tests failed:', err);
    await browser.close();
    process.exit(2);
  }
})();