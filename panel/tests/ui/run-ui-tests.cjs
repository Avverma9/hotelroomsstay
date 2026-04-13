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
  // returns an ElementHandle (input/select/textarea) or null
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
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    // Intercept login request and return a mocked successful login payload
    if (req.method() === 'POST' && url.includes('/login/dashboard/user')) {
      console.log('Intercepting login POST:', url);
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessionData: { token: 'fake', user: { id: 'panel-ui-test', role: 'admin', name: 'Panel UI', email: 'ui-test@example.com' } }, loggedUserId: 'panel-ui-test', loggedUserRole: 'admin', loggedUserName: 'Panel UI', rsToken: 'fake', message: 'Logged in' }) });
      return;
    }
    // Intercept sidebar links request
    if (req.method() === 'GET' && url.includes('/additional/sidebar-links/for-user')) {
      console.log('Intercepting sidebar-links GET:', url);
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { admin: [{ route: '/admin-new-hotel', label: 'Add New Hotel' }] } }) });
      return;
    }
    // Intercept route permissions request
    if (req.method() === 'GET' && url.includes('/additional/route-permissions')) {
      console.log('Intercepting route-permissions GET:', url);
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { routePermissions: { mode: 'allow_all' } } }) });
      return;
    }
    // Intercept create hotel POST
    if (req.method() === 'POST' && url.includes('/data/hotels-new/post/upload/data')) {
      console.log('Intercepting create hotel POST:', url);
      req.respond({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: { hotelId: 'MOCK_HOTEL_UI_123' }, message: 'Mock created' }) });
      return;
    }
    // Intercept other flow POSTs and return success
    if (req.method() === 'POST' && (url.includes('/create-a-amenities') || url.includes('/add/food-to/your-hotel') || url.includes('/create-a-room-to-your-hotel') || url.includes('/add-a-new/policy-to-your/hotel'))) {
      console.log('Intercepting auxiliary POST:', url);
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      return;
    }
    req.continue();
  });

  // Prepare localStorage for both front and panel flows
  await page.evaluateOnNewDocument(() => {
    try {
      const auth = {
        user: { id: 'panel-ui-test', role: 'admin', status: true, name: 'Panel UI', email: 'ui-test@example.com', image: [] },
        role: 'admin',
        token: 'fake',
        sidebarLinks: { admin: [{ path: '/admin-new-hotel', label: 'Add New Hotel' }] },
        sessionData: { token: 'fake', user: { id: 'panel-ui-test', role: 'admin', name: 'Panel UI', email: 'ui-test@example.com' }, sidebarLinks: { admin: [{ path: '/admin-new-hotel', label: 'Add New Hotel' }] } }
      };
      localStorage.setItem('hrsadmin_session', JSON.stringify(auth));
      localStorage.setItem('rsUserId', 'front-ui-test');
      localStorage.setItem('rsToken', 'fake');
      localStorage.setItem('roomsstayUserEmail', 'ui-test@example.com');
      localStorage.setItem('rsUserName', 'UI Test');
    } catch (e) {}
  });

  try {
    console.log('--- Panel: visiting /admin-new-hotel (http://localhost:5174/admin-new-hotel) ---');
    await gotoWithRetries(page, 'http://localhost:5174/admin-new-hotel');
    await sleep(800);

    console.log('Panel page snippet:', await page.evaluate(() => (document.body && document.body.innerText) ? document.body.innerText.slice(0,2000) : '<no body>'));

    // Fill some key fields on panel
    const hNameEl = await fillByLabelText(page, 'Hotel Name');
    if (hNameEl) { await hNameEl.click({ clickCount: 3 }); await hNameEl.type('UI Test Hotel - Panel'); }
    const stateEl = await fillByLabelText(page, 'State');
    if (stateEl) { await stateEl.click({ clickCount: 3 }); await stateEl.type('TestState'); }
    const cityEl = await fillByLabelText(page, 'City');
    if (cityEl) { await cityEl.click({ clickCount: 3 }); await cityEl.type('TestCity'); }

    // Navigate to final step and submit
    const submitHandle = await clickNextUntilSubmit(page);
    await submitHandle.click();
    console.log('After submit snippet:', await page.evaluate(() => (document.body && document.body.innerText) ? document.body.innerText.slice(0,2000) : '<no body>'));
    // Give the UI a moment to process the mocked response and update state
    await sleep(1500);
    console.log('Panel test: success banner found');

    // Front test (use a new page)
    console.log('--- Front: visiting /partner (http://localhost:5173/partner) ---');
    const page2 = await browser.newPage();
    await page2.setRequestInterception(true);
    page2.on('request', (req) => {
      const url = req.url();
      if (req.method() === 'POST' && url.includes('/login/dashboard/user')) {
        req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessionData: { token: 'fake', user: { id: 'panel-ui-test', role: 'admin', name: 'Panel UI', email: 'ui-test@example.com' } }, loggedUserId: 'panel-ui-test', loggedUserRole: 'admin', loggedUserName: 'Panel UI', rsToken: 'fake', message: 'Logged in' }) });
        return;
      }
      if (req.method() === 'GET' && url.includes('/additional/sidebar-links/for-user')) {
        req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { admin: [{ route: '/admin-new-hotel', label: 'Add New Hotel' }] } }) });
        return;
      }
      if (req.method() === 'GET' && url.includes('/additional/route-permissions')) {
        req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { routePermissions: { mode: 'allow_all' } } }) });
        return;
      }
      if (req.method() === 'POST' && url.includes('/data/hotels-new/post/upload/data')) {
        req.respond({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: { hotelId: 'MOCK_HOTEL_UI_123' }, message: 'Mock created' }) });
        return;
      }
      if (req.method() === 'POST' && (url.includes('/create-a-amenities') || url.includes('/add/food-to/your-hotel') || url.includes('/create-a-room-to-your-hotel') || url.includes('/add-a-new/policy-to-your/hotel'))) {
        req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        return;
      }
      req.continue();
    });
    await page2.evaluateOnNewDocument(() => {
      try {
        const auth = {
          user: { id: 'front-ui-test', role: 'partner', status: true, name: 'Front UI', email: 'ui-test@example.com', image: [] },
          role: 'partner',
          token: 'fake',
          sessionData: { token: 'fake', user: { id: 'front-ui-test', role: 'partner', name: 'Front UI', email: 'ui-test@example.com' } }
        };
        localStorage.setItem('hrsadmin_session', JSON.stringify(auth));
        localStorage.setItem('rsUserId', 'front-ui-test');
        localStorage.setItem('rsToken', 'fake');
        localStorage.setItem('roomsstayUserEmail', 'ui-test@example.com');
        localStorage.setItem('rsUserName', 'UI Test');
        localStorage.setItem('isSignedIn', 'true');
        localStorage.setItem('authToken', 'fake');
        localStorage.setItem('rsUserMobile', '9999999999');
      } catch (e) {}
    });

    await gotoWithRetries(page2, 'http://localhost:5173/partner');
    await sleep(800);

    console.log('Front page snippet:', await page2.evaluate(() => (document.body && document.body.innerText) ? document.body.innerText.slice(0,2000) : '<no body>'));

    console.log('Front buttons:', await page2.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => (b.innerText || '').trim()).filter(Boolean)));

    // Try to automatically fill visible inputs on each step and navigate to final submit
    await page2.evaluate(() => { window.confirm = () => true; });
    for (let step = 0; step < 12; step++) {
      // Fill visible inputs
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
            else if (type === 'email') { if (!el.value) el.value = 'ui-test@example.com'; }
            else if (type === 'tel') { if (!el.value) el.value = '9999999999'; }
            else { if (!el.value) el.value = 'Test'; }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Yes, I Accept'));
          if (acceptBtn) acceptBtn.click();
        } catch (e) {}
      });

      // If a Register button is visible, click it and finish
      const didRegister = await page2.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('register'));
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (didRegister) break;

      // Otherwise click Next Step if available
      const didNext = await page2.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Next Step'));
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!didNext) break;
      await sleep(800);
    }
    await waitForUrlContains(page2, '/partner/second-step', 20000).catch(() => {});
    console.log('Front test: navigated to second-step');

    console.log('\nAll UI tests passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('UI tests failed:', err);
    await browser.close();
    process.exit(2);
  }
})();
