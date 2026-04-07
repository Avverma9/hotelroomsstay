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
  console.log("Logged in ✓\n");

  // ── Confirm amenities data structure ──────────────────────────────────────
  const all = await get("/hotels/filters?limit=50", T);
  const hotels = all.data;
  console.log("=== Amenities data structures in DB ===");
  hotels.filter(h => h.amenities && h.amenities.length > 0).forEach(h => {
    const t = typeof h.amenities[0];
    console.log(`  ${h.hotelName}: type=${t} | ${JSON.stringify(h.amenities).substring(0, 80)}`);
  });

  // ── BUG 1: amenities=WiFi (string array structure) ────────────────────────
  console.log("\n=== BUG 1: amenities=WiFi (Grand Palace has ['Free WiFi','Swimming Pool']) ===");
  const r1 = await get("/hotels/filters?amenities=WiFi&limit=30", T);
  const gpInResult = (r1.data || []).some(h => h.hotelName === "Grand Palace Hotel");
  console.log(`  API returned ${r1.total} hotels for amenities=WiFi`);
  console.log(`  Grand Palace Hotel in results: ${gpInResult}`);
  if (r1.total === 0 || !gpInResult) {
    console.log(`  ${B} CONFIRMED: amenities=WiFi returns 0 / excludes Grand Palace despite having 'Free WiFi'`);
  } else {
    console.log(`  ${G}`);
  }

  // ── BUG 1b: amenities=Spa ─────────────────────────────────────────────────
  console.log("\n=== BUG 1b: amenities=Spa ===");
  const r1b = await get("/hotels/filters?amenities=Spa&limit=30", T);
  console.log(`  API returned ${r1b.total} hotels for amenities=Spa`);
  const gpInSpa = (r1b.data || []).some(h => h.hotelName === "Grand Palace Hotel");
  console.log(`  Grand Palace in result (has Spa): ${gpInSpa}`);
  if (!gpInSpa) console.log(`  ${B} Grand Palace excluded despite having 'Spa' in string amenities array`);

  // ── BUG 2: amenities=Fan (object array with multiple values) ──────────────
  console.log("\n=== BUG 2: amenities=Fan (Amaravati has {amenities:['Drinking Water','CCTV','Fan','TV']}) ===");
  const r2 = await get("/hotels/filters?amenities=Fan&limit=30", T);
  console.log(`  API returned ${r2.total} hotels for amenities=Fan`);
  const amarInResult = (r2.data || []).some(h => h.hotelName === "Amaravati Residency");
  console.log(`  Amaravati Residency in results: ${amarInResult}`);
  
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
  console.log(`  Hotels that SHOULD match: ${shouldMatchFan.map(h => h.hotelName).join(", ")}`);
  if (r2.total !== shouldMatchFan.length || !amarInResult) {
    console.log(`  ${B} Expected ${shouldMatchFan.length}, got ${r2.total}`);
  } else {
    console.log(`  ${G}`);
  }

  // ── BUG 3: amenities=TV (single-element object array - may work) ──────────
  console.log("\n=== BUG 3: amenities=TV ===");
  const r3 = await get("/hotels/filters?amenities=TV&limit=30", T);
  console.log(`  API returned ${r3.total} hotels for amenities=TV`);
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
  console.log(`  Hotels SHOULD match TV: ${shouldMatchTV.map(h => h.hotelName).join(", ")}`);
  if (r3.total !== shouldMatchTV.length) {
    console.log(`  ${B} Expected ${shouldMatchTV.length}, got ${r3.total}`);
  } else {
    console.log(`  ${G}`);
  }

  // ── BUG 4: propertyType partial substring bug ─────────────────────────────
  console.log("\n=== BUG 4: propertyType=Budget (should match 'Budget Hotel') ===");
  const r4 = await get("/hotels/filters?propertyType=Budget&limit=30", T);
  console.log(`  API returned ${r4.total} for propertyType=Budget`);
  const shouldMatchBudget = hotels.filter(h =>
    (h.propertyType || []).some(pt => pt.toLowerCase().includes("budget"))
  );
  console.log(`  Hotels with 'Budget' in propertyType: ${shouldMatchBudget.map(h => h.hotelName + " [" + h.propertyType + "]").join(", ")}`);
  if (r4.total !== shouldMatchBudget.length) {
    console.log(`  ${B} Expected ${shouldMatchBudget.length}, got ${r4.total}`);
    console.log(`  Root cause: arrayContainsAnyText uses exact Array.includes() but MongoDB uses $regex partial match`);
  } else {
    console.log(`  ${G}`);
  }

  // ── objectArrayContainsAnyText manual simulation ──────────────────────────
  console.log("\n=== Simulating objectArrayContainsAnyText for Amaravati amenities ===");
  const amenitiesArr = [{"hotelId":"20394857","amenities":["Drinking Water","CCTV","Fan","TV"]}];
  const normalizedValues = amenitiesArr
    .flatMap(item => Object.values(item || {}))
    .map(item => String(item).trim().toLowerCase())
    .filter(Boolean);
  console.log("  Object.values result after flatMap:", normalizedValues);
  console.log("  Searching for 'fan':", normalizedValues.includes("fan"));
  console.log("  Searching for 'tv':", normalizedValues.includes("tv"));
  console.log(`  → ${B} 'fan' is part of 'drinking water,cctv,fan,tv' string (the array got stringified)`);
}

run().catch(console.error);
