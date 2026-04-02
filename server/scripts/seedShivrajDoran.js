/**
 * Seed Script: Shivraj Hotel & Doran Hotel
 * Seeds complete hotel data including rooms, amenities, foods, policies, monthly prices
 * Run: node scripts/seedShivrajDoran.js
 */

const connectDB = require("../config/db");
const Hotel = require("../models/hotel/basicDetails");
const Amenities = require("../models/hotel/amenities");
const Foods = require("../models/hotel/foods");
const Policies = require("../models/hotel/policies");
const MonthlyPrice = require("../models/booking/monthly");

// ─── Hotel IDs ────────────────────────────────────────────────────────────────
const SHIVRAJ_ID = "20260101";
const DORAN_ID = "20260102";

// ─── SHIVRAJ HOTEL ────────────────────────────────────────────────────────────
const shivrajHotel = {
  hotelId: SHIVRAJ_ID,
  hotelName: "Shivraj Hotel",
  description:
    "Shivraj Hotel is a premium 3-star property nestled in the heart of Bhopal, offering a blend of modern comfort and traditional Madhya Pradesh hospitality. Ideal for business and leisure travellers, featuring spacious rooms, a rooftop restaurant, and swift access to key city landmarks like Upper Lake and Van Vihar.",
  hotelOwnerName: "Rajesh Patel",
  destination: "Bhopal",
  state: "Madhya Pradesh",
  city: "Bhopal",
  latitude: "23.2599",
  longitude: "77.4126",
  landmark: "Near Upper Lake, MP Nagar",
  pinCode: 462011,
  hotelCategory: "Hotel",
  starRating: "3",
  propertyType: ["Hotel", "Business Hotel"],
  contact: 9876501234,
  hotelEmail: "shivrajhotel@gmail.com",
  generalManagerContact: "9876502222",
  salesManagerContact: "9876503333",
  customerWelcomeNote:
    "Welcome to Shivraj Hotel! We are delighted to host you. Enjoy our complimentary breakfast and 24-hour room service. Please reach out to our front desk for any assistance.",
  isAccepted: true,
  onFront: true,
  localId: "Accepted",
  rating: 4.2,
  reviewCount: 87,
  ratingBreakdown: {
    cleanliness: 4.4,
    service: 4.3,
    valueForMoney: 4.0,
    location: 4.1,
  },
  ratingDistribution: {
    oneStar: 2,
    twoStar: 5,
    threeStar: 10,
    fourStar: 35,
    fiveStar: 35,
  },
  startDate: new Date("2024-01-01"),
  endDate: new Date("2026-12-31"),
  images: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
    "https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800",
  ],
  rooms: [
    {
      roomId: "SHV-R001",
      hotelId: SHIVRAJ_ID,
      type: "Standard Double Room",
      bedTypes: "Double Bed",
      price: 1800,
      originalPrice: 2200,
      isOffer: true,
      offerName: "Summer Saver Deal",
      offerPriceLess: 400,
      offerExp: new Date("2026-06-30"),
      soldOut: false,
      countRooms: 8,
      totalRooms: 10,
      images: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
      ],
    },
    {
      roomId: "SHV-R002",
      hotelId: SHIVRAJ_ID,
      type: "Deluxe King Room",
      bedTypes: "King Bed",
      price: 2800,
      originalPrice: 3200,
      isOffer: true,
      offerName: "Early Bird Offer",
      offerPriceLess: 400,
      offerExp: new Date("2026-05-31"),
      soldOut: false,
      countRooms: 5,
      totalRooms: 6,
      images: [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
        "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=800",
      ],
    },
    {
      roomId: "SHV-R003",
      hotelId: SHIVRAJ_ID,
      type: "Executive Suite",
      bedTypes: "King Bed + Sofa",
      price: 4500,
      originalPrice: 5000,
      isOffer: false,
      offerName: "N/A",
      offerPriceLess: 0,
      soldOut: false,
      countRooms: 2,
      totalRooms: 3,
      images: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
        "https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800",
      ],
    },
    {
      roomId: "SHV-R004",
      hotelId: SHIVRAJ_ID,
      type: "Triple Sharing Room",
      bedTypes: "3 Single Beds",
      price: 2400,
      originalPrice: 2800,
      isOffer: false,
      offerName: "N/A",
      offerPriceLess: 0,
      soldOut: false,
      countRooms: 4,
      totalRooms: 5,
      images: [
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
      ],
    },
  ],
};

// ─── DORAN HOTEL ──────────────────────────────────────────────────────────────
const doranHotel = {
  hotelId: DORAN_ID,
  hotelName: "Doran Hotel",
  description:
    "Doran Hotel is a comfortable 2-star budget hotel located in the commercial hub of Indore, offering clean and well-maintained rooms at affordable prices. With easy connectivity to Rajwada Palace, Sarafa Bazaar, and the railway station, it is the perfect base for travellers exploring the city. Features complimentary Wi-Fi, parking, and an in-house dining facility.",
  hotelOwnerName: "Suresh Doran",
  destination: "Indore",
  state: "Madhya Pradesh",
  city: "Indore",
  latitude: "22.7196",
  longitude: "75.8577",
  landmark: "Near Rajwada Palace, Old Palasia",
  pinCode: 452001,
  hotelCategory: "Budget Hotel",
  starRating: "2",
  propertyType: ["Hotel", "Budget Hotel"],
  contact: 9812345678,
  hotelEmail: "doranhotel@gmail.com",
  generalManagerContact: "9812346666",
  salesManagerContact: "9812347777",
  customerWelcomeNote:
    "Welcome to Doran Hotel! Enjoy our budget-friendly amenities and warm hospitality. Our staff is available 24/7 to assist you during your stay.",
  isAccepted: true,
  onFront: true,
  localId: "Accepted",
  rating: 3.8,
  reviewCount: 54,
  ratingBreakdown: {
    cleanliness: 3.7,
    service: 3.9,
    valueForMoney: 4.2,
    location: 3.5,
  },
  ratingDistribution: {
    oneStar: 3,
    twoStar: 8,
    threeStar: 14,
    fourStar: 20,
    fiveStar: 9,
  },
  startDate: new Date("2024-03-01"),
  endDate: new Date("2026-12-31"),
  images: [
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
  ],
  rooms: [
    {
      roomId: "DRN-R001",
      hotelId: DORAN_ID,
      type: "Standard Double Room",
      bedTypes: "Double Bed",
      price: 900,
      originalPrice: 1100,
      isOffer: true,
      offerName: "Budget Treat",
      offerPriceLess: 200,
      offerExp: new Date("2026-07-31"),
      soldOut: false,
      countRooms: 10,
      totalRooms: 12,
      images: [
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
        "https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=800",
      ],
    },
    {
      roomId: "DRN-R002",
      hotelId: DORAN_ID,
      type: "Triple Room",
      bedTypes: "1 Double Bed + 1 Single Bed",
      price: 1300,
      originalPrice: 1500,
      isOffer: false,
      offerName: "N/A",
      offerPriceLess: 0,
      soldOut: false,
      countRooms: 6,
      totalRooms: 7,
      images: [
        "https://images.unsplash.com/photo-1609766857584-c9d1a8261f3b?w=800",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
      ],
    },
    {
      roomId: "DRN-R003",
      hotelId: DORAN_ID,
      type: "Single Economy Room",
      bedTypes: "Single Bed",
      price: 600,
      originalPrice: 750,
      isOffer: true,
      offerName: "Solo Saver",
      offerPriceLess: 150,
      offerExp: new Date("2026-06-30"),
      soldOut: false,
      countRooms: 8,
      totalRooms: 10,
      images: [
        "https://images.unsplash.com/photo-1631049070489-fa2e7370d5a0?w=800",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      ],
    },
  ],
};

// ─── AMENITIES ────────────────────────────────────────────────────────────────
const shivrajAmenities = {
  hotelId: SHIVRAJ_ID,
  amenities: [
    "Free Wi-Fi",
    "24-Hour Front Desk",
    "Air Conditioning",
    "Room Service",
    "Rooftop Restaurant",
    "Parking",
    "Laundry Service",
    "Daily Housekeeping",
    "CCTV Surveillance",
    "Fire Safety Equipment",
    "Elevator / Lift",
    "Power Backup",
    "Hot & Cold Water",
    "Flat-Screen TV",
    "Minibar",
    "Work Desk",
    "Iron & Ironing Board",
    "Wake-Up Service",
    "Luggage Storage",
    "Currency Exchange",
    "Conference Room",
    "Complimentary Breakfast",
    "Swimming Pool",
    "Gym / Fitness Center",
  ],
};

const doranAmenities = {
  hotelId: DORAN_ID,
  amenities: [
    "Free Wi-Fi",
    "24-Hour Front Desk",
    "Air Conditioning",
    "Parking",
    "Daily Housekeeping",
    "CCTV Surveillance",
    "Power Backup",
    "Hot & Cold Water",
    "Flat-Screen TV",
    "Wake-Up Service",
    "Luggage Storage",
    "Fire Safety Equipment",
    "Elevator / Lift",
    "In-House Dining",
    "Drinking Water",
  ],
};

// ─── FOODS ────────────────────────────────────────────────────────────────────
const shivrajFoods = [
  {
    hotelId: SHIVRAJ_ID,
    name: "Morning Breakfast Buffet",
    foodType: "Veg",
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    ],
    about:
      "A wholesome buffet spread with poha, idli, paratha, fruits, juices, bread-butter, and tea/coffee. Included for all guests.",
    price: 250,
  },
  {
    hotelId: SHIVRAJ_ID,
    name: "Dal Makhani Thali",
    foodType: "Veg",
    images: [
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
    ],
    about:
      "Rich and creamy dal makhani served with 4 rotis, steamed rice, raita, salad, and papad. Signature dish of Shivraj kitchen.",
    price: 320,
  },
  {
    hotelId: SHIVRAJ_ID,
    name: "Chicken Biryani",
    foodType: "Non-Veg",
    images: [
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    ],
    about:
      "Aromatic Lucknawi-style chicken biryani cooked on dum with saffron, whole spices, and served with raita and mirchi ka salan.",
    price: 450,
  },
  {
    hotelId: SHIVRAJ_ID,
    name: "Special Bhopal Gosht Korma",
    foodType: "Non-Veg",
    images: [
      "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800",
    ],
    about:
      "Traditional Bhopali mutton korma slow-cooked with cashews, cream, and aromatic spices. Served with rumali roti.",
    price: 550,
  },
  {
    hotelId: SHIVRAJ_ID,
    name: "Paneer Butter Masala + Naan",
    foodType: "Veg",
    images: [
      "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800",
    ],
    about:
      "Soft paneer cubes in a rich tomato-cream gravy. Served with 2 butter naans and a house salad.",
    price: 280,
  },
  {
    hotelId: SHIVRAJ_ID,
    name: "Fresh Fruit Platter (Room Service)",
    foodType: "Veg",
    images: [
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800",
    ],
    about:
      "Seasonal fresh fruit platter including mango, watermelon, pineapple, and grapes. Available for room delivery 24/7.",
    price: 180,
  },
];

const doranFoods = [
  {
    hotelId: DORAN_ID,
    name: "Complimentary Morning Tea & Biscuits",
    foodType: "Veg",
    images: [
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800",
    ],
    about:
      "A complimentary morning tea/coffee with biscuits served to all guests between 7 AM – 9 AM.",
    price: 0,
  },
  {
    hotelId: DORAN_ID,
    name: "Poha & Jalebi Breakfast",
    foodType: "Veg",
    images: [
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
    ],
    about:
      "Authentic Indori poha with finely chopped onion, mustard seeds, curry leaves, and sev served with crispy jalebi — the classic Indore breakfast.",
    price: 120,
  },
  {
    hotelId: DORAN_ID,
    name: "Sabudana Khichdi",
    foodType: "Veg",
    images: [
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",
    ],
    about:
      "Light and flavourful sabudana khichdi with peanuts, cumin, and fresh coriander. Served with curd.",
    price: 100,
  },
  {
    hotelId: DORAN_ID,
    name: "Rajma Rice Combo",
    foodType: "Veg",
    images: [
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
    ],
    about:
      "Classic North Indian rajma with steamed rice, papad, and pickle. Simple, filling, and affordable.",
    price: 180,
  },
  {
    hotelId: DORAN_ID,
    name: "Egg Omelette Plate",
    foodType: "Non-Veg",
    images: [
      "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800",
    ],
    about:
      "2-egg masala omelette with onion, tomato, and green chilli served with 2 toasted bread slices and ketchup.",
    price: 90,
  },
];

// ─── POLICIES ─────────────────────────────────────────────────────────────────
const shivrajPolicies = {
  hotelId: SHIVRAJ_ID,
  hotelsPolicy:
    "Guests must provide a valid photo ID (Aadhaar/Passport/DL) at check-in. The hotel reserves the right to refuse accommodation to guests violating hotel policies.",
  checkInPolicy: "Check-in time: 12:00 PM. Early check-in subject to room availability and may attract an additional charge.",
  checkOutPolicy: "Check-out time: 11:00 AM. Late checkout until 3:00 PM available on request at ₹500 extra. After 3:00 PM, a full-day charge applies.",
  outsideFoodPolicy: "Outside food and beverages are not allowed inside hotel rooms. Guests may consume packed snacks only.",
  cancellationPolicy:
    "Free cancellation up to 48 hours before check-in. Cancellations within 24 hours will be charged 1 night's room rate. No-show will be charged the full booking amount.",
  paymentMode: "Cash, UPI (GPay, PhonePe, Paytm), Debit/Credit Card, Net Banking",
  petsAllowed: "No",
  bachelorAllowed: "Yes",
  smokingAllowed: "No – smoking is strictly prohibited in all indoor areas. A designated smoking zone is available on the terrace.",
  alcoholAllowed: "Yes – permitted in rooms only. Not allowed in common areas.",
  unmarriedCouplesAllowed: "Yes",
  internationalGuestAllowed: "Yes – guests must provide a valid passport and visa copy at check-in.",
  refundPolicy:
    "Refunds for eligible cancellations will be processed within 5–7 business days to the original payment source.",
  onDoubleSharing: "₹2800",
  onTripleSharing: "₹3600",
  onQuadSharing: "₹4400",
  onBulkBooking: "₹2200 per room (10+ rooms)",
  onMoreThanFour: "Contact us for group pricing",
  offDoubleSharing: "₹1800",
  offTrippleSharing: "₹2500",
  offQuadSharing: "₹3000",
  offBulkBooking: "₹1500 per room (10+ rooms)",
  offMoreThanFour: "Contact us for group pricing",
  onDoubleSharingAp: "₹2800 + ₹250 breakfast/person",
  onQuadSharingAp: "₹4400 + ₹250 breakfast/person",
  onBulkBookingAp: "₹2200 + ₹200 breakfast/person",
  onTrippleSharingAp: "₹3600 + ₹250 breakfast/person",
  onMoreThanFourAp: "Contact for AP group rates",
  offDoubleSharingAp: "₹1800 + ₹200 breakfast/person",
  offQuadSharingAp: "₹3000 + ₹200 breakfast/person",
  offBulkBookingAp: "₹1500 + ₹180 breakfast/person",
  offTrippleSharingAp: "₹2500 + ₹200 breakfast/person",
  offMoreThanFourAp: "Contact for off-season AP group rates",
  onDoubleSharingMAp: "₹3200 (breakfast + dinner)",
  onQuadSharingMAp: "₹5200 (breakfast + dinner)",
  onBulkBookingMAp: "₹2600 (breakfast + dinner)",
  onTrippleSharingMAp: "₹4200 (breakfast + dinner)",
  onMoreThanFourMAp: "Contact for MAP group rates",
  offDoubleSharingMAp: "₹2300 (breakfast + dinner)",
  offQuadSharingMAp: "₹3600 (breakfast + dinner)",
  offBulkBookingMAp: "₹1900 (breakfast + dinner)",
  offTrippleSharingMAp: "₹3000 (breakfast + dinner)",
  offMoreThanFourMAp: "Contact for off-season MAP group rates",
};

const doranPolicies = {
  hotelId: DORAN_ID,
  hotelsPolicy:
    "All guests must carry a valid government-issued ID proof. The management holds the right to deny accommodation without refund in case of misconduct.",
  checkInPolicy: "Check-in time: 1:00 PM. Early check-in available from 9:00 AM subject to availability (no extra charge).",
  checkOutPolicy: "Check-out time: 11:00 AM. Late checkout up to 2:00 PM at no extra cost. After 2:00 PM, half-day charge of ₹300 applies.",
  outsideFoodPolicy: "Outside food is permitted. The hotel does not impose restrictions on outside food.",
  cancellationPolicy:
    "Free cancellation up to 24 hours before check-in. Cancellation within 12 hours will attract a charge of ₹500. No-show will be charged first-night rate.",
  paymentMode: "Cash, UPI (GPay, PhonePe, Paytm), Debit Card",
  petsAllowed: "No",
  bachelorAllowed: "Yes",
  smokingAllowed: "No – smoking is not allowed on hotel premises.",
  alcoholAllowed: "No",
  unmarriedCouplesAllowed: "Yes",
  internationalGuestAllowed: "Yes",
  refundPolicy:
    "Eligible refunds will be processed within 3–5 business days.",
  onDoubleSharing: "₹1300",
  onTripleSharing: "₹1700",
  onQuadSharing: "₹2000",
  onBulkBooking: "₹1000 per room (8+ rooms)",
  onMoreThanFour: "Contact manager for group rates",
  offDoubleSharing: "₹900",
  offTrippleSharing: "₹1300",
  offQuadSharing: "₹1500",
  offBulkBooking: "₹750 per room (8+ rooms)",
  offMoreThanFour: "Contact manager for group rates",
  onDoubleSharingAp: "₹1300 + ₹120 breakfast/person",
  onQuadSharingAp: "₹2000 + ₹120 breakfast/person",
  onBulkBookingAp: "₹1000 + ₹100 breakfast/person",
  onTrippleSharingAp: "₹1700 + ₹120 breakfast/person",
  onMoreThanFourAp: "Contact for AP group rates",
  offDoubleSharingAp: "₹900 + ₹100 breakfast/person",
  offQuadSharingAp: "₹1500 + ₹100 breakfast/person",
  offBulkBookingAp: "₹750 + ₹80 breakfast/person",
  offTrippleSharingAp: "₹1300 + ₹100 breakfast/person",
  offMoreThanFourAp: "Contact for off-season AP rates",
  onDoubleSharingMAp: "₹1600 (breakfast + dinner)",
  onQuadSharingMAp: "₹2600 (breakfast + dinner)",
  onBulkBookingMAp: "₹1300 (breakfast + dinner)",
  onTrippleSharingMAp: "₹2100 (breakfast + dinner)",
  onMoreThanFourMAp: "Contact for MAP group rates",
  offDoubleSharingMAp: "₹1200 (breakfast + dinner)",
  offQuadSharingMAp: "₹2000 (breakfast + dinner)",
  offBulkBookingMAp: "₹950 (breakfast + dinner)",
  offTrippleSharingMAp: "₹1600 (breakfast + dinner)",
  offMoreThanFourMAp: "Contact for off-season MAP group rates",
};

// ─── MONTHLY PRICES ───────────────────────────────────────────────────────────
// Shivraj Hotel monthly pricing (peak & off-season)
const shivrajMonthlyPrices = [
  // Standard Double Room - Peak (Apr–Jun 2026)
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R001", startDate: "2026-04-01", endDate: "2026-06-30", monthPrice: 2000 },
  // Standard Double Room - Off season (Jul–Sep 2026)
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R001", startDate: "2026-07-01", endDate: "2026-09-30", monthPrice: 1600 },
  // Standard Double Room - Festival season (Oct–Dec 2026)
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R001", startDate: "2026-10-01", endDate: "2026-12-31", monthPrice: 2200 },

  // Deluxe King Room - Peak
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R002", startDate: "2026-04-01", endDate: "2026-06-30", monthPrice: 3000 },
  // Deluxe King Room - Off season
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R002", startDate: "2026-07-01", endDate: "2026-09-30", monthPrice: 2500 },
  // Deluxe King Room - Festival season
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R002", startDate: "2026-10-01", endDate: "2026-12-31", monthPrice: 3500 },

  // Executive Suite - Peak
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R003", startDate: "2026-04-01", endDate: "2026-06-30", monthPrice: 5000 },
  // Executive Suite - Off season
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R003", startDate: "2026-07-01", endDate: "2026-09-30", monthPrice: 4000 },
  // Executive Suite - Festival season
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R003", startDate: "2026-10-01", endDate: "2026-12-31", monthPrice: 5500 },

  // Triple Sharing Room - Peak
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R004", startDate: "2026-04-01", endDate: "2026-06-30", monthPrice: 2600 },
  // Triple Sharing Room - Off season
  { hotelId: SHIVRAJ_ID, roomId: "SHV-R004", startDate: "2026-07-01", endDate: "2026-09-30", monthPrice: 2000 },
];

// Doran Hotel monthly pricing
const doranMonthlyPrices = [
  // Standard Double Room - Peak
  { hotelId: DORAN_ID, roomId: "DRN-R001", startDate: "2026-04-01", endDate: "2026-06-30", monthPrice: 1000 },
  // Standard Double Room - Off season
  { hotelId: DORAN_ID, roomId: "DRN-R001", startDate: "2026-07-01", endDate: "2026-09-30", monthPrice: 800 },
  // Standard Double Room - Festival
  { hotelId: DORAN_ID, roomId: "DRN-R001", startDate: "2026-10-01", endDate: "2026-12-31", monthPrice: 1100 },

  // Triple Room - Peak
  { hotelId: DORAN_ID, roomId: "DRN-R002", startDate: "2026-04-01", endDate: "2026-06-30", monthPrice: 1500 },
  // Triple Room - Off season
  { hotelId: DORAN_ID, roomId: "DRN-R002", startDate: "2026-07-01", endDate: "2026-09-30", monthPrice: 1200 },
  // Triple Room - Festival
  { hotelId: DORAN_ID, roomId: "DRN-R002", startDate: "2026-10-01", endDate: "2026-12-31", monthPrice: 1700 },

  // Single Economy Room - Peak
  { hotelId: DORAN_ID, roomId: "DRN-R003", startDate: "2026-04-01", endDate: "2026-06-30", monthPrice: 700 },
  // Single Economy Room - Off season
  { hotelId: DORAN_ID, roomId: "DRN-R003", startDate: "2026-07-01", endDate: "2026-09-30", monthPrice: 550 },
];

// ─── SEED RUNNER ──────────────────────────────────────────────────────────────
async function seed() {
  try {
    await connectDB();
    console.log("✔  DB connected");

    // 1. Upsert hotel basicDetails (includes embedded rooms)
    for (const hotel of [shivrajHotel, doranHotel]) {
      await Hotel.findOneAndUpdate(
        { hotelId: hotel.hotelId },
        { $set: hotel },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✔  Hotel upserted: ${hotel.hotelName} (${hotel.hotelId})`);
    }

    // 2. Upsert amenities (one doc per hotel, unique on hotelId)
    for (const doc of [shivrajAmenities, doranAmenities]) {
      await Amenities.findOneAndUpdate(
        { hotelId: doc.hotelId },
        { $set: doc },
        { upsert: true, new: true }
      );
      console.log(`✔  Amenities upserted for hotelId: ${doc.hotelId}`);
    }

    // 3. Upsert policies (one doc per hotel, unique on hotelId)
    for (const doc of [shivrajPolicies, doranPolicies]) {
      await Policies.findOneAndUpdate(
        { hotelId: doc.hotelId },
        { $set: doc },
        { upsert: true, new: true }
      );
      console.log(`✔  Policies upserted for hotelId: ${doc.hotelId}`);
    }

    // 4. Upsert foods (keyed by hotelId + name)
    for (const food of [...shivrajFoods, ...doranFoods]) {
      await Foods.findOneAndUpdate(
        { hotelId: food.hotelId, name: food.name },
        { $set: food },
        { upsert: true, new: true }
      );
      console.log(`✔  Food upserted: "${food.name}" (${food.hotelId})`);
    }

    // 5. Upsert monthly prices (keyed by hotelId + roomId + startDate + endDate)
    for (const mp of [...shivrajMonthlyPrices, ...doranMonthlyPrices]) {
      await MonthlyPrice.findOneAndUpdate(
        { hotelId: mp.hotelId, roomId: mp.roomId, startDate: mp.startDate, endDate: mp.endDate },
        { $set: mp },
        { upsert: true, new: true }
      );
      console.log(`✔  MonthlyPrice upserted: ${mp.roomId} ${mp.startDate}→${mp.endDate} ₹${mp.monthPrice}`);
    }

    console.log("\n✅  Seed complete — Shivraj Hotel & Doran Hotel fully seeded.");
  } catch (err) {
    console.error("❌  Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await Hotel.db.close();
  }
}

seed();
