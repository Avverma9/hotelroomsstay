const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Hotel = require("../models/hotel/basicDetails");

const hotels = [
  {
    hotelId: "48291034",
    hotelName: "Aurum Boutique Hotel",
    description:
      "Experience luxury and comfort in the heart of the city with premium suites, curated dining, and thoughtful hospitality for business and leisure travelers.",
    hotelOwnerName: "Rajesh Sharma",
    destination: "Patna",
    onFront: true,
    state: "Bihar",
    city: "Patna",
    latitude: "25.6093",
    longitude: "85.1376",
    landmark: "Near Gandhi Maidan",
    pinCode: 800001,
    hotelCategory: "Luxury",
    rating: 4.4,
    reviewCount: 128,
    starRating: "4",
    propertyType: ["Hotel", "Boutique"],
    contact: 9876543210,
    isAccepted: true,
    localId: "Accepted",
    hotelEmail: "contact@aurumboutique.com",
    generalManagerContact: "9876543211",
    salesManagerContact: "9876543212",
    customerWelcomeNote: "Welcome to Aurum Boutique Hotel",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    ],
    rooms: [
      {
        roomId: "RM-101",
        hotelId: "48291034",
        name: "Deluxe King",
        type: "Deluxe King",
        bedTypes: "King Size",
        images: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 4500,
        originalPrice: 4500,
        isOffer: true,
        offerName: "Winter Special",
        offerPriceLess: 500,
        offerExp: new Date("2026-12-31T23:59:59.000Z"),
        soldOut: false,
        countRooms: 5,
        totalRooms: 5,
      },
      {
        roomId: "RM-102",
        hotelId: "48291034",
        name: "Executive Suite",
        type: "Executive Suite",
        bedTypes: "King Size + Sofa Bed",
        images: [
          "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 7500,
        originalPrice: 7500,
        isOffer: false,
        offerName: "N/A",
        offerPriceLess: 0,
        offerExp: null,
        soldOut: false,
        countRooms: 2,
        totalRooms: 2,
      },
    ],
    foods: [
      {
        foodId: "FD-101",
        hotelId: "48291034",
        name: "Breakfast Buffet",
        foodType: "Veg",
        about: "Unlimited breakfast buffet served from 7 AM to 10 AM.",
        images: [
          "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 299,
      },
      {
        foodId: "FD-102",
        hotelId: "48291034",
        name: "Chef Special Thali",
        foodType: "Veg",
        about: "Regional plated meal with dessert and beverage.",
        images: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 499,
      },
      {
        foodId: "FD-103",
        hotelId: "48291034",
        name: "Chicken Signature Bowl",
        foodType: "Non-Veg",
        about: "Slow-cooked chicken bowl with aromatic rice.",
        images: [
          "https://images.unsplash.com/photo-1604908176997-431f4a76b7a1?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 599,
      },
    ],
    amenities: [
      {
        hotelId: "48291034",
        amenities: ["Free WiFi", "Swimming Pool", "Gym & Spa", "Valet Parking"],
      },
    ],
    policies: [
      {
        hotelId: "48291034",
        hotelsPolicy:
          "Valid government ID is mandatory at check-in. Damage to hotel property is chargeable.",
        checkInPolicy: "12:00 PM",
        checkOutPolicy: "11:00 AM",
        outsideFoodPolicy: "Outside food is not allowed in restaurant areas.",
        cancellationPolicy: "Free cancellation allowed before 24 hours of check-in.",
        paymentMode: "UPI, Card, Cash",
        petsAllowed: "No",
        bachelorAllowed: "No",
        smokingAllowed: "No",
        alcoholAllowed: "No",
        unmarriedCouplesAllowed: "No",
        internationalGuestAllowed: "Yes",
        refundPolicy: "Eligible refunds are processed within 5-7 working days.",
        returnPolicy: "Non-refundable after check-in.",
        rules: ["Carry valid ID proof", "Maintain quiet hours after 10 PM"],
        restrictions: {
          petsAllowed: false,
          smokingAllowed: false,
          alcoholAllowed: false,
        },
      },
    ],
  },
  {
    hotelId: "57382146",
    hotelName: "Blue Orchid Residency",
    description:
      "Modern upscale residency with spacious rooms, skyline dining, conference facilities, and family-friendly hospitality.",
    hotelOwnerName: "Neha Verma",
    destination: "Jaipur",
    onFront: false,
    state: "Rajasthan",
    city: "Jaipur",
    latitude: "26.9124",
    longitude: "75.7873",
    landmark: "Near World Trade Park",
    pinCode: 302017,
    hotelCategory: "Premium",
    rating: 4.2,
    reviewCount: 86,
    starRating: "4",
    propertyType: ["Hotel", "Business Stay"],
    contact: 9898989898,
    isAccepted: true,
    localId: "Accepted",
    hotelEmail: "hello@blueorchidresidency.com",
    generalManagerContact: "9898989801",
    salesManagerContact: "9898989802",
    customerWelcomeNote: "Welcome to Blue Orchid Residency",
    images: [
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80",
    ],
    rooms: [
      {
        roomId: "RM-201",
        hotelId: "57382146",
        name: "Premium Twin",
        type: "Premium Twin",
        bedTypes: "Twin Bed",
        images: [
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 4000,
        originalPrice: 4000,
        isOffer: false,
        offerName: "N/A",
        offerPriceLess: 0,
        offerExp: null,
        soldOut: false,
        countRooms: 6,
        totalRooms: 6,
      },
      {
        roomId: "RM-202",
        hotelId: "57382146",
        name: "Family Suite",
        type: "Family Suite",
        bedTypes: "King Size + Twin Bed",
        images: [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 6800,
        originalPrice: 6800,
        isOffer: true,
        offerName: "Family Saver",
        offerPriceLess: 800,
        offerExp: new Date("2026-10-31T23:59:59.000Z"),
        soldOut: false,
        countRooms: 3,
        totalRooms: 3,
      },
    ],
    foods: [
      {
        foodId: "FD-201",
        hotelId: "57382146",
        name: "Continental Platter",
        foodType: "Veg",
        about: "Freshly baked breads, eggs, fruits, and beverages.",
        images: [
          "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 349,
      },
      {
        foodId: "FD-202",
        hotelId: "57382146",
        name: "Rajasthani Thali",
        foodType: "Veg",
        about: "Traditional thali with dal bati churma and house desserts.",
        images: [
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 549,
      },
      {
        foodId: "FD-203",
        hotelId: "57382146",
        name: "Mutton Laal Maas",
        foodType: "Non-Veg",
        about: "Signature spicy mutton curry served with breads.",
        images: [
          "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80",
        ],
        price: 749,
      },
    ],
    amenities: [
      {
        hotelId: "57382146",
        amenities: [
          "Free WiFi",
          "Rooftop Restaurant",
          "Conference Hall",
          "Airport Pickup",
          "Kids Play Area",
        ],
      },
    ],
    policies: [
      {
        hotelId: "57382146",
        hotelsPolicy:
          "All guests must provide valid ID proof. Extra bed charges are applicable where available.",
        checkInPolicy: "01:00 PM",
        checkOutPolicy: "10:00 AM",
        outsideFoodPolicy: "Outside food allowed in rooms only.",
        cancellationPolicy: "50% charge if cancelled within 24 hours of check-in.",
        paymentMode: "UPI, Card, Net Banking, Cash",
        petsAllowed: "No",
        bachelorAllowed: "Yes",
        smokingAllowed: "No",
        alcoholAllowed: "Yes",
        unmarriedCouplesAllowed: "Yes",
        internationalGuestAllowed: "Yes",
        refundPolicy: "Refunds are subject to payment gateway timelines.",
        returnPolicy: "Non-refundable on no-show bookings.",
        rules: ["Carry valid ID proof", "No loud music after 10 PM"],
        restrictions: {
          petsAllowed: false,
          smokingAllowed: false,
          alcoholAllowed: true,
        },
      },
    ],
  },


];

const run = async () => {
  try {
    await connectDB();

    for (const hotel of hotels) {
      await Hotel.findOneAndUpdate(
        { hotelId: hotel.hotelId },
        { $set: hotel },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`Seeded ${hotels.length} hotels with rooms, foods, amenities, and policies.`);
  } catch (error) {
    console.error("Failed to seed hotels:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
