/**
 * Full test script for /hotels/filters API
 * Run: node scripts/test_filters.js
 */

require("dotenv").config();
const http = require("http");

function httpPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        host: "localhost",
        port: 5000,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(new Error(`Parse error: ${d}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function httpGet(path, token) {
  return new Promise((resolve, reject) => {
    http.get(
      {
        host: "localhost",
        port: 5000,
        path,
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(d) });
          } catch (e) {
            reject(new Error(`Parse error (status ${res.statusCode}): ${d.substring(0, 200)}`));
          }
        });
      }
    );
  });
}

const PASS = "\x1b[32mPASS\x1b[0m";
const FAIL = "\x1b[31mFAIL\x1b[0m";
const WARN = "\x1b[33mBUG \x1b[0m";

function check(label, condition, expected, actual) {
  const ok = condition;
  console.log(`  [${ok ? PASS : FAIL}] ${label}`);
  if (!ok) {
    console.log(`         Expected: ${JSON.stringify(expected)}`);
    console.log(`         Actual  : ${JSON.stringify(actual)}`);
  }
  return ok;
}

async function runTests() {
  console.log("=".repeat(70));
  console.log("  /hotels/filters - Full Test Suite");
  console.log("=".repeat(70));

  // ─── Login ────────────────────────────────────────────────────────────────
  console.log("\n[SETUP] Logging in...");
  const loginResp = await httpPost("/login/dashboard/user", {
    email: "Av95766@gmail.com",
    password: "Avverma@1",
  });
  const TOKEN = loginResp.rsToken;
  if (!TOKEN) {
    console.error("Login failed:", loginResp);
    process.exit(1);
  }
  console.log("  Token acquired ✓");

  // ─── Baseline ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 1] Baseline — no filters");
  const t1 = await httpGet("/hotels/filters?limit=50", TOKEN);
  const allHotels = t1.body.data || [];
  check("status 200", t1.status === 200, 200, t1.status);
  check("returns hotels", allHotels.length > 0, ">0", allHotels.length);
  check("has total field", typeof t1.body.total === "number", "number", typeof t1.body.total);
  check("only isAccepted=true by default", allHotels.every(h => h.isAccepted === true), true, allHotels.find(h => !h.isAccepted)?.hotelName);
  console.log(`  Total accepted hotels in DB: ${t1.body.total}`);

  // ─── Property Type Filter ──────────────────────────────────────────────────
  console.log("\n[TEST 2] propertyType filter");

  // Build a map of all unique property types in DB
  const propTypeMap = {};
  allHotels.forEach(h => {
    (h.propertyType || []).forEach(pt => {
      propTypeMap[pt] = (propTypeMap[pt] || 0) + 1;
    });
  });
  console.log("  PropertyTypes in DB:", Object.keys(propTypeMap).join(", ") || "(none)");

  // Test with a known type
  const knownType = Object.keys(propTypeMap)[0];
  if (knownType) {
    // Both MongoDB ($regex partial) and in-memory now use substring match consistently
    const t2a = await httpGet(`/hotels/filters?propertyType=${encodeURIComponent(knownType)}&limit=50`, TOKEN);
    const t2aHotels = t2a.body.data || [];
    // Correct expected: substring match (any propertyType element that contains the search term)
    const expectedCount = allHotels.filter(h =>
      (h.propertyType || []).some(pt => pt.toLowerCase().includes(knownType.toLowerCase()))
    ).length;
    check(
      `propertyType="${knownType}" substring match (${expectedCount} expected)`,
      t2aHotels.length === expectedCount,
      expectedCount,
      t2aHotels.length
    );

    // Test PARTIAL match — substring of known type
    const partialType = knownType.split(" ")[0]; // e.g. "Budget" from "Budget Hotel"
    if (partialType !== knownType) {
      const t2b = await httpGet(`/hotels/filters?propertyType=${encodeURIComponent(partialType)}&limit=50`, TOKEN);
      const t2bHotels = t2b.body.data || [];
      const expectedPartial = allHotels.filter(h =>
        (h.propertyType || []).some(pt => pt.toLowerCase().includes(partialType.toLowerCase()))
      ).length;
      check(
        `propertyType="${partialType}" partial/substring match (${expectedPartial} expected)`,
        t2bHotels.length === expectedPartial,
        expectedPartial,
        t2bHotels.length
      );
    }
  } else {
    console.log("  SKIP: No propertyType data in DB to test");
  }

  // ─── Amenities Filter ─────────────────────────────────────────────────────
  console.log("\n[TEST 3] amenities filter");

  // Find a hotel with amenities
  const hotelWithAmenities = allHotels.find(h => h.amenities && h.amenities.length > 0);
  if (hotelWithAmenities) {
    console.log(`  Sample hotel amenities (${hotelWithAmenities.hotelName}):`, JSON.stringify(hotelWithAmenities.amenities.slice(0, 2)));

    // Extract an amenity value to test
    const firstAmenityObj = hotelWithAmenities.amenities[0];
    let testAmenity = null;
    if (typeof firstAmenityObj === "object" && firstAmenityObj !== null) {
      const vals = Object.values(firstAmenityObj);
      for (const v of vals) {
        if (typeof v === "string" && v.length > 2 && v !== hotelWithAmenities.hotelId) {
          testAmenity = v;
          break;
        }
        if (Array.isArray(v) && v.length > 0) {
          testAmenity = v[0];
          break;
        }
      }
    }

    if (testAmenity) {
      console.log(`  Testing amenity: "${testAmenity}"`);
      const t3 = await httpGet(`/hotels/filters?amenities=${encodeURIComponent(testAmenity)}&limit=50`, TOKEN);
      const t3Hotels = t3.body.data || [];
      console.log(`  Hotels returned with amenities="${testAmenity}": ${t3Hotels.length}`);

      // Manually check which hotels SHOULD match
      const shouldMatch = allHotels.filter(h => {
        if (!h.amenities) return false;
        const allValues = h.amenities.flatMap(item => {
          if (!item || typeof item !== "object") return [];
          return Object.values(item).flatMap(v => Array.isArray(v) ? v : [v]);
        });
        return allValues.some(v => String(v).toLowerCase().includes(testAmenity.toLowerCase()));
      });

      check(
        `amenities="${testAmenity}" returns ${shouldMatch.length} hotels`,
        t3Hotels.length === shouldMatch.length,
        shouldMatch.length,
        t3Hotels.length
      );

      if (t3Hotels.length !== shouldMatch.length) {
        console.log(`  ${WARN} BUG: 'objectArrayContainsAnyText' fails for nested arrays.`);
        console.log(`         String(["WiFi","AC"]) = "WiFi,AC" — includes("WiFi") = false`);
      }
    } else {
      console.log("  SKIP: Could not extract amenity value from structure");
    }
  } else {
    console.log("  SKIP: No hotels with amenities in DB");
  }

  // ─── Star Rating Filter ────────────────────────────────────────────────────
  console.log("\n[TEST 4] starRating filter");
  const t4a = await httpGet("/hotels/filters?starRating=5&limit=20", TOKEN);
  const t4aHotels = t4a.body.data || [];
  const expected5Star = allHotels.filter(h => h.starRating === "5" || h.starRating === 5).length;
  check(`starRating=5 exact match (${expected5Star} expected)`, t4aHotels.length === expected5Star, expected5Star, t4aHotels.length);
  t4aHotels.forEach(h => console.log(`    ${h.hotelName} - starRating: ${h.starRating}`));

  // Test range filter
  const t4b = await httpGet("/hotels/filters?minStarRating=3&maxStarRating=5&limit=20", TOKEN);
  const t4bHotels = t4b.body.data || [];
  const expectedRange = allHotels.filter(h => Number(h.starRating) >= 3 && Number(h.starRating) <= 5).length;
  const allInRange = t4bHotels.every(h => Number(h.starRating) >= 3 && Number(h.starRating) <= 5);
  check(`minStarRating=3&maxStarRating=5 count (${expectedRange} expected)`, t4bHotels.length === expectedRange, expectedRange, t4bHotels.length);
  check(`all returned hotels have starRating 3-5`, allInRange, true, t4bHotels.map(h=>h.starRating).join(","));
  if (!allInRange) {
    console.log(`  ${WARN} BUG: String comparison for starRating range may be wrong`);
    t4bHotels.filter(h => Number(h.starRating) < 3 || Number(h.starRating) > 5)
      .forEach(h => console.log(`    WRONG: ${h.hotelName} has starRating=${h.starRating}`));
  }

  // ─── Price Filter ──────────────────────────────────────────────────────────
  console.log("\n[TEST 5] price filter (minPrice/maxPrice)");
  const t5 = await httpGet("/hotels/filters?minPrice=500&maxPrice=3000&limit=50", TOKEN);
  const t5Hotels = t5.body.data || [];
  console.log(`  Hotels with price 500-3000: ${t5Hotels.length}`);
  const allInPriceRange = t5Hotels.every(h => {
    const price = h.pricing?.startingFrom;
    return price === undefined || (price >= 500 && price <= 3000);
  });
  check("all returned hotels have price in range", allInPriceRange, true, t5Hotels.filter(h => {
    const p = h.pricing?.startingFrom; return p !== undefined && (p < 500 || p > 3000);
  }).map(h => `${h.hotelName}:${h.pricing?.startingFrom}`).join(", "));

  // ─── City Filter ────────────────────────────────────────────────────────────
  console.log("\n[TEST 6] city filter");
  const cities = [...new Set(allHotels.map(h => h.city).filter(Boolean))];
  console.log("  Cities in DB:", cities.slice(0, 5).join(", "));
  if (cities.length > 0) {
    const testCity = cities[0];
    const t6 = await httpGet(`/hotels/filters?city=${encodeURIComponent(testCity)}&limit=20`, TOKEN);
    const t6Hotels = t6.body.data || [];
    const expectedCity = allHotels.filter(h => h.city?.toLowerCase().includes(testCity.toLowerCase())).length;
    check(`city="${testCity}" match (${expectedCity} expected)`, t6Hotels.length === expectedCity, expectedCity, t6Hotels.length);
  }

  // ─── Search Filter ────────────────────────────────────────────────────────
  console.log("\n[TEST 7] search filter");
  if (allHotels.length > 0) {
    const searchTerm = allHotels[0].city || allHotels[0].hotelName?.split(" ")[0];
    const t7 = await httpGet(`/hotels/filters?search=${encodeURIComponent(searchTerm)}&limit=20`, TOKEN);
    const t7Hotels = t7.body.data || [];
    const expectedSearch = allHotels.filter(h =>
      [h.city, h.state, h.landmark, h.hotelName, h.destination].some(v =>
        v?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ).length;
    check(`search="${searchTerm}" (${expectedSearch} expected)`, t7Hotels.length === expectedSearch, expectedSearch, t7Hotels.length);
  }

  // ─── onlyAvailable Filter ─────────────────────────────────────────────────
  console.log("\n[TEST 8] onlyAvailable filter with dates");
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const d1 = today.toISOString().slice(0, 10);
  const d2 = tomorrow.toISOString().slice(0, 10);
  const t8 = await httpGet(`/hotels/filters?checkInDate=${d1}&checkOutDate=${d2}&onlyAvailable=true&limit=20`, TOKEN);
  const t8Hotels = t8.body.data || [];
  console.log(`  Available hotels on ${d1}: ${t8Hotels.length}`);
  const allCanBook = t8Hotels.every(h => h.availability?.canBook === true);
  check("all returned hotels have canBook=true", allCanBook, true, t8Hotels.filter(h => !h.availability?.canBook).map(h => h.hotelName).join(", "));

  // ─── Pagination ────────────────────────────────────────────────────────────
  console.log("\n[TEST 9] pagination");
  const t9a = await httpGet("/hotels/filters?limit=2&page=1", TOKEN);
  const t9b = await httpGet("/hotels/filters?limit=2&page=2", TOKEN);
  const page1Ids = t9a.body.data.map(h => h.hotelId);
  const page2Ids = t9b.body.data.map(h => h.hotelId);
  const noOverlap = !page1Ids.some(id => page2Ids.includes(id));
  check("page 1 and page 2 have no overlap", noOverlap, true, `p1: [${page1Ids}] p2: [${page2Ids}]`);
  check("totalPages correct", t9a.body.totalPages === Math.ceil(t9a.body.total / 2), Math.ceil(t9a.body.total / 2), t9a.body.totalPages);

  // ─── Sort ──────────────────────────────────────────────────────────────────
  console.log("\n[TEST 10] sorting");
  const t10asc = await httpGet("/hotels/filters?sortBy=price&sortOrder=asc&limit=20", TOKEN);
  const t10desc = await httpGet("/hotels/filters?sortBy=price&sortOrder=desc&limit=20", TOKEN);
  const prices_asc = t10asc.body.data.map(h => h.pricing?.startingFrom || 0);
  const prices_desc = t10desc.body.data.map(h => h.pricing?.startingFrom || 0);
  const isSortedAsc = prices_asc.every((p, i) => i === 0 || p >= prices_asc[i - 1]);
  const isSortedDesc = prices_desc.every((p, i) => i === 0 || p <= prices_desc[i - 1]);
  check("sortBy=price&sortOrder=asc — prices ascending", isSortedAsc, "ascending", JSON.stringify(prices_asc));
  check("sortBy=price&sortOrder=desc — prices descending", isSortedDesc, "descending", JSON.stringify(prices_desc));

  // ─── hasOffer Filter ──────────────────────────────────────────────────────
  console.log("\n[TEST 11] hasOffer filter");
  const t11 = await httpGet("/hotels/filters?hasOffer=true&limit=20", TOKEN);
  const t11Hotels = t11.body.data || [];
  console.log(`  Hotels with offer: ${t11Hotels.length}`);
  const allHaveOffer = t11Hotels.every(h => (h.rooms || []).some(r => r.isOffer === true));
  if (t11Hotels.length > 0) {
    check("all returned hotels have at least one offer room", allHaveOffer, true, t11Hotels.filter(h => !(h.rooms||[]).some(r=>r.isOffer)).map(h=>h.hotelName).join(","));
  }

  // ─── GST Info ─────────────────────────────────────────────────────────────
  console.log("\n[TEST 12] GST info in response");
  const t12 = await httpGet("/hotels/filters?limit=1", TOKEN);
  console.log("  gstInfo:", JSON.stringify(t12.body.gstInfo));
  check("gstInfo field present in response", t12.body.hasOwnProperty("gstInfo"), true, "missing");

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log("  Tests complete.");
  console.log("=".repeat(70));
}

runTests().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
