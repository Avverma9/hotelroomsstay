const connectDB = require("../config/db");
const Tour = require("../models/tour/tour");

const tours = [
  {
    agencyId: "ui-test-agency-1",
    travelAgencyName: "UI Test Travels",
    agencyEmail: "ui-test-1@example.com",
    isAccepted: true,
    country: "India",
    state: "Rajasthan",
    city: "Jaipur",
    visitngPlaces: "Jaipur | Amber Fort | City Palace",
    themes: "heritage",
    price: 6000,
    nights: 2,
    days: 3,
    from: new Date("2026-10-18T00:00:00.000Z"),
    to: new Date("2026-10-20T23:59:59.000Z"),
    tourStartDate: new Date("2026-10-18T00:00:00.000Z"),
    tourEndDate: new Date("2026-10-20T23:59:59.000Z"),
    vehicles: [{
      name: "UI Test Coach 1",
      vehicleNumber: "UITEST-001",
      totalSeats: 4,
      seatConfig: { rows: 2, left: 1, right: 1, aisle: true },
      seaterType: "1x1",
      seatLayout: ["A1", "B1", "A2", "B2"],
      pricePerSeat: 6000,
      isActive: true,
    }],
  },
  {
    agencyId: "ui-test-agency-2",
    travelAgencyName: "UI Test Holidays",
    agencyEmail: "ui-test-2@example.com",
    isAccepted: true,
    country: "India",
    state: "Kerala",
    city: "Kochi",
    visitngPlaces: "Kochi | Munnar | Alleppey",
    themes: "nature",
    price: 8000,
    nights: 3,
    days: 4,
    from: new Date("2026-10-25T00:00:00.000Z"),
    to: new Date("2026-10-28T23:59:59.000Z"),
    tourStartDate: new Date("2026-10-25T00:00:00.000Z"),
    tourEndDate: new Date("2026-10-28T23:59:59.000Z"),
    vehicles: [{
      name: "UI Test Coach 2",
      vehicleNumber: "UITEST-002",
      totalSeats: 4,
      seatConfig: { rows: 2, left: 1, right: 1, aisle: true },
      seaterType: "1x1",
      seatLayout: ["A1", "B1", "A2", "B2"],
      pricePerSeat: 8000,
      isActive: true,
    }],
  },
];

(async () => {
  await connectDB();
  for (const tour of tours) {
    await Tour.findOneAndUpdate(
      { agencyId: tour.agencyId },
      { $set: tour },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Seeded ${tours.length} UI test tours.`);
  await Tour.db.close();
})().catch((error) => {
  console.error("Tour seed failed:", error);
  process.exitCode = 1;
});
