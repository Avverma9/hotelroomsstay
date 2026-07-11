const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  let refreshCalls = 0;
  let deniedRouteCalls = 0;

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();

    if (url.includes('/auth/refresh/dashboard')) {
      refreshCalls += 1;
      req.respond({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Refresh failed' }),
      });
      return;
    }

    if (url.includes('/test-403-route')) {
      deniedRouteCalls += 1;
      req.respond({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Access denied for this route' }),
      });
      return;
    }

    req.continue();
  });

  try {
    await page.evaluateOnNewDocument(() => {
      const auth = {
        user: { id: 'smoke-user', role: 'admin', name: 'Smoke User', email: 'smoke@example.com' },
        role: 'admin',
        token: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        sidebarLinks: {},
        sessionData: {
          token: 'fake-access-token',
          user: { id: 'smoke-user', role: 'admin', name: 'Smoke User', email: 'smoke@example.com' },
          sidebarLinks: {},
        },
      };
      localStorage.setItem('hrsadmin_session', JSON.stringify(auth));
      sessionStorage.setItem('hrsadmin_session', JSON.stringify(auth));
    });

    await page.goto('http://localhost:5174/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });

    const result = await page.evaluate(async () => {
      const mod = await import('/src/api.js');
      let status = 'unknown';
      try {
        await mod.default.get('/test-403-route', { skipGlobalLoader: true });
        status = 'unexpected-success';
      } catch (err) {
        status = String(err?.response?.status || 'no-status');
      }

      return {
        status,
        hasSession: Boolean(localStorage.getItem('hrsadmin_session')),
        path: window.location.pathname,
      };
    });

    const pass = result.hasSession === true && result.path !== '/login' && refreshCalls === 0 && deniedRouteCalls > 0;

    console.log('SMOKE_RESULT', JSON.stringify({ ...result, refreshCalls, deniedRouteCalls, pass }));

    await browser.close();
    process.exit(pass ? 0 : 1);
  } catch (error) {
    console.error('SMOKE_ERROR', error?.message || error);
    await browser.close();
    process.exit(1);
  }
})();
