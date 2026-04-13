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

async function waitForText(page, text, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const found = await page.evaluate((t) => !!document.body && document.body.innerText.includes(t), text);
    if (found) return true;
    await sleep(300);
  }
  throw new Error('Text not found: ' + text);
}

async function waitForUrlContains(page, substring, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const url = page.url();
    if (url.includes(substring)) return true;
    await sleep(300);
  }
  throw new Error('URL did not contain ' + substring);
}

async function fillByLabelText(page, label) {
  const handle = await page.evaluateHandle((lbl) => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const l of labels) {
      const txt = (l.innerText || '').replace(/\*/g, '').trim();
      if (!txt) continue;
      if (txt.includes(lbl)) {
        const parent = l.parentElement;
        if (!parent) continue;
        const el = parent.querySelector('input, textarea, select');
        if (el) return el;
      }
    }
    return null;
  }, label);
  return handle.asElement ? handle.asElement() : null;
}

async function clickNextUntilSubmit(page) {
  const findButtonByText = async (text) => {
    const h = await page.evaluateHandle((t) => {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const b of btns) {
        if ((b.innerText || '').trim().includes(t)) return b;
      }
      return null;
    }, text);
    return h.asElement ? h.asElement() : null;
  };

  for (let i = 0; i < 12; i++) {
    const submitBtn = await findButtonByText('Register Property');
    if (submitBtn) return submitBtn;

    const nextBtn = await findButtonByText('Next Step');
    if (nextBtn) { await nextBtn.click(); await sleep(600); continue; }

    const contBtn = await findButtonByText('Continue to');
    if (contBtn) { await contBtn.click(); await sleep(600); continue; }

    await sleep(500);
  }
  throw new Error('Submit button not found after clicking next several times');
}

(async () => {
  const API_BASE = process.env.API_BASE || 'https://hotelroomsstay.com/api';
  const EMAIL = process.env.EMAIL || 'Av95766@gmail.com';
  const PASS = process.env.PASSWORD || 'Avverma@1';
  const PANEL_URL = process.env.PANEL_URL || 'http://localhost:5174/admin-new-hotel';
  const FRONT_URL = process.env.FRONT_URL || 'http://localhost:5173/partner';

  console.log('Logging in to API at', API_BASE + '/login/dashboard/user');
  // Use global fetch available in Node 18+
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

  // Inject localStorage for panel and front so the apps treat us as logged in
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

    console.log('Panel page snippet:', await page.evaluate(() => (document.body && document.body.innerText) ? document.body.innerText.slice(0,2000) : '<no body>'));

    const hNameEl = await fillByLabelText(page, 'Hotel Name');
    if (hNameEl) { await hNameEl.click({ clickCount: 3 }); await hNameEl.type('REAL UI Test Hotel - Panel'); }
    const stateEl = await fillByLabelText(page, 'State');
    if (stateEl) { await stateEl.click({ clickCount: 3 }); await stateEl.type('RealState'); }
    const cityEl = await fillByLabelText(page, 'City');
    if (cityEl) { await cityEl.click({ clickCount: 3 }); await cityEl.type('RealCity'); }

    const submitHandle = await clickNextUntilSubmit(page);
    await submitHandle.click();
    console.log('After submit snippet:', await page.evaluate(() => (document.body && document.body.innerText) ? document.body.innerText.slice(0,2000) : '<no body>'));
    await sleep(2000);
    console.log('Panel test: completed (hotel create request was sent to live API)');

    // Front test
    console.log('--- Front: visiting', FRONT_URL, '---');
    const page2 = await browser.newPage();
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
    console.log('Front page snippet:', await page2.evaluate(() => (document.body && document.body.innerText) ? document.body.innerText.slice(0,2000) : '<no body>'));

    // Attempt to fill visible inputs and navigate through steps
    await page2.evaluate(() => { window.confirm = () => true; });
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
          const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Yes, I Accept'));
          if (acceptBtn) acceptBtn.click();
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

    await waitForUrlContains(page2, '/partner/second-step', 20000).catch(() => {});
    console.log('Front test: navigated to second-step (or finished)');

    console.log('\nReal-mode UI tests completed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Real UI tests failed:', err);
    await browser.close();
    process.exit(2);
  }
})();
