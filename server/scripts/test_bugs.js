/**
 * Targeted bug confirmation tests for amenities and propertyType filters
 */
require("dotenv").config();
const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify(body);
    const r = http.request(
      { host: "localhost", port: 5000, path, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(d) } },
      (res) => { let x = ""; res.on("data", (c) => (x += c)); res.on("end", () => resolve(JSON.parse(x))); }
    );
    r.on("error", reject); r.write(d); r.end();
  });
}

function get(path, tok) {
  return new Promise((resolve, reject) => {
    http.get(
      { host: "localhost", port: 5000, path, headers: { Authorization: "Bearer " + tok } },
      (res) => { let x = ""; res.on("data", (c) => (x += c)); res.on("end", () => resolve(JSON.parse(x))); }
    ).on("error", reject);
  });
}

const G = "\x1b[32m✓ PASS\x1b[0m";
const B = "\x1b[31m✗ BUG \x1b[0m";

async function run() {
  const login = await post("/login/dashboard/user", { email: "Av95766@gmail.com", password: "Avverma@1" });
  const T = login.rsToken;
  undefined;

  // ── Confirm amenities data structure ──────────────────────────────────────
  const all = await get("/hotels/filters?limit=50", T);
  const hotels = all.data;
  undefined;
  hotels.filter(h => h.amenities && h.amenities.length > 0).forEach(h => {
    const t = typeof h.amenities[0];
    undefined;
  });

  // ── BUG 1: amenities=WiFi (string array structure) ────────────────────────
  undefined;
  const r1 = await get("/hotels/filters?amenities=WiFi&limit=30", T);
  const gpInResult = (r1.data || []).some(h => h.hotelName === "Grand Palace Hotel");
  undefined;
  undefined;
  if (r1.total === 0 || !gpInResult) {
    undefined;
  } else {
    undefined;
  }

  // ── BUG 1b: amenities=Spa ─────────────────────────────────────────────────
  undefined;
  const r1b = await get("/hotels/filters?amenities=Spa&limit=30", T);
  undefined;
  const gpInSpa = (r1b.data || []).some(h => h.hotelName === "Grand Palace Hotel");
  undefined;
  if (!gpInSpa) undefined;

  // ── BUG 2: amenities=Fan (object array with multiple values) ──────────────
  undefined;
  const r2 = await get("/hotels/filters?amenities=Fan&limit=30", T);
  undefined;
  const amarInResult = (r2.data || []).some(h => h.hotelName === "Amaravati Residency");
  undefined;
  
  // What SHOULD match:
  const shouldMatchFan = hotels.filter(h => {
    return (h.amenities || []).some(item => {
      if (typeof item === "string") return item.toLowerCase().includes("fan");
      if (typeof item === "object" && item !== null) {
        const vals = Object.values(item).flatMap(v => Array.isArray(v) ? v : [v]);
        return vals.some(v => String(v).toLowerCase().includes("fan"));
      }
      return false;
    });
  });
  undefined;
  if (r2.total !== shouldMatchFan.length || !amarInResult) {
    undefined;
  } else {
    undefined;
  }

  // ── BUG 3: amenities=TV (single-element object array - may work) ──────────
  undefined;
  const r3 = await get("/hotels/filters?amenities=TV&limit=30", T);
  undefined;
  const shouldMatchTV = hotels.filter(h =>
    (h.amenities || []).some(item => {
      if (typeof item === "string") return item.toLowerCase().includes("tv");
      if (typeof item === "object" && item !== null) {
        const vals = Object.values(item).flatMap(v => Array.isArray(v) ? v : [v]);
        return vals.some(v => String(v).toLowerCase().includes("tv"));
      }
      return false;
    })
  );
  undefined;
  if (r3.total !== shouldMatchTV.length) {
    undefined;
  } else {
    undefined;
  }

  // ── BUG 4: propertyType partial substring bug ─────────────────────────────
  undefined;
  const r4 = await get("/hotels/filters?propertyType=Budget&limit=30", T);
  undefined;
  const shouldMatchBudget = hotels.filter(h =>
    (h.propertyType || []).some(pt => pt.toLowerCase().includes("budget"))
  );
  undefined;
  if (r4.total !== shouldMatchBudget.length) {
    undefined;
    undefined;
  } else {
    undefined;
  }

  // ── objectArrayContainsAnyText manual simulation ──────────────────────────
  undefined;
  const amenitiesArr = [{"hotelId":"20394857","amenities":["Drinking Water","CCTV","Fan","TV"]}];
  const normalizedValues = amenitiesArr
    .flatMap(item => Object.values(item || {}))
    .map(item => String(item).trim().toLowerCase())
    .filter(Boolean);
  undefined;
  undefined;
  undefined;
  undefined;
}

run().catch(console.error);
