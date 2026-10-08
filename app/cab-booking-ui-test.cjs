const puppeteer = require("../panel/node_modules/puppeteer");

const baseUrl = process.env.HRS_UI_URL || "http://localhost:8081";
const email = process.env.HRS_TEST_EMAIL || "Av95766@gmail.com";
const password = process.env.HRS_TEST_PASSWORD || "Avverma@1";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function visibleText(page) {
  return page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
}

async function clickText(page, text, { exact = false } = {}) {
  const clicked = await page.evaluate(({ text, exact }) => {
    const nodes = [...document.querySelectorAll("button,[role=button],a,div")];
    const node = nodes.find((el) => {
      const value = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      const childHasSameText = [...el.children].some((child) => (child.innerText || child.textContent || "").replace(/\s+/g, " ").trim() === value);
      return !childHasSameText && (exact ? value === text : value.includes(text));
    });
    if (!node) return false;
    const target = node.closest('[tabindex="0"]') || node;
    target.focus();
    target.scrollIntoView({ block: "center" });
    const rect = target.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, { text, exact });
  if (!clicked) throw new Error(`UI control not found: ${text}`);
  await page.mouse.click(clicked.x, clicked.y);
  await page.mouse.move(clicked.x, clicked.y);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.press("Enter").catch(() => {});
  await sleep(500);
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const consoleErrors = [];
  const network = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("request", (request) => { if (request.url().includes("signIn") || request.url().includes("5000") || request.method() === "POST") network.push({ type: "request", method: request.method(), url: request.url() }); });
  page.on("response", async (response) => { if (response.url().includes("signIn") || response.url().includes("5000")) { let body = null; try { body = (await response.text()).slice(0, 500); } catch {} network.push({ type: "response", url: response.url(), status: response.status(), body }); } });
  page.on("requestfailed", (request) => { if (request.url().includes("signIn") || request.url().includes("5000") || request.method() === "POST") network.push({ type: "failed", method: request.method(), url: request.url(), error: request.failure()?.errorText }); });

  const result = { url: baseUrl, viewport: { width: 390, height: 844 }, login: null, scenarios: [], consoleErrors, network };
  await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(3000);
  result.initialText = (await visibleText(page)).slice(0, 1200);

  const inputs = await page.$$eval("input", (els) => els.map((el) => ({ type: el.type, placeholder: el.placeholder, value: el.value })));
  if (inputs.some((input) => input.type === "password")) {
    console.log(JSON.stringify({ inputs, controls: await page.$$eval("button,[role=button],a", (els) => els.map((el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 80)), signInNodes: await page.$$eval("*", (els) => els.filter((el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim() === "Sign In").slice(-5).map((el) => { let out=[]; for(let n=el;n&&out.length<5;n=n.parentElement) out.push(n.outerHTML.slice(0,700)); return out; })), text: (await visibleText(page)).slice(0, 1800) }, null, 2));
    await page.type('input[type="email"]', email).catch(async () => {
      const candidate = (await page.$$("input"))[0];
      if (candidate) await candidate.type(email);
    });
    await page.type('input[type="password"]', password);
    await clickText(page, "Sign In");
    await page.mouse.click(195, 590);
    await sleep(12000);
    result.login = { text: (await visibleText(page)).slice(0, 1000) };
  } else {
    result.login = { skipped: true, reason: "Existing session or boot screen did not expose password input", inputs };
  }

  result.afterLoginText = (await visibleText(page)).slice(0, 1600);
  await page.screenshot({ path: "cab-ui-after-login.png", fullPage: true });
  await browser.close();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
