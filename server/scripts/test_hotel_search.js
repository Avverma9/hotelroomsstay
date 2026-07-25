/**
 * Test script to debug hotel search issue
 * Run with: node server/scripts/test_hotel_search.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const hotelModel = require('../models/hotel/basicDetails');

const MONGODB_URL = process.env.MONGO_URI || process.env.MONGODB_URL || process.env.MONGODB_URI;

console.log('Environment check:');
console.log('MONGODB_URL exists:', !!MONGODB_URL);
console.log('');

async function testHotelSearch() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check total hotels
    const totalHotels = await hotelModel.countDocuments();
    console.log(`📊 Total hotels in database: ${totalHotels}\n`);

    // Test 2: Check hotels with "gandhi" in name (case-insensitive)
    const gandhiHotels = await hotelModel.find({
      hotelName: { $regex: 'gandhi', $options: 'i' }
    }).select('hotelName city state isAccepted onFront').lean();
    
    console.log(`🔍 Hotels with "gandhi" in name: ${gandhiHotels.length}`);
    gandhiHotels.forEach((hotel, idx) => {
      console.log(`  ${idx + 1}. ${hotel.hotelName} (${hotel.city}, ${hotel.state})`);
      console.log(`     isAccepted: ${hotel.isAccepted}, onFront: ${hotel.onFront}`);
    });
    console.log('');

    // Test 3: Check for accepted hotels only
    const acceptedGandhiHotels = await hotelModel.find({
      hotelName: { $regex: 'gandhi', $options: 'i' },
      isAccepted: true
    }).select('hotelName city state rooms').lean();
    
    console.log(`✅ Accepted hotels with "gandhi": ${acceptedGandhiHotels.length}`);
    acceptedGandhiHotels.forEach((hotel, idx) => {
      console.log(`  ${idx + 1}. ${hotel.hotelName} (${hotel.city}, ${hotel.state})`);
      console.log(`     Total rooms: ${hotel.rooms?.length || 0}`);
    });
    console.log('');

    // Test 4: Search using the same logic as API ($or with multiple fields)
    const searchTerm = 'hotel gandhi';
    const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const apiStyleFilter = {
      isAccepted: true,
      $or: [
        { city: { $regex: escapeRegex(searchTerm), $options: 'i' } },
        { state: { $regex: escapeRegex(searchTerm), $options: 'i' } },
        { landmark: { $regex: escapeRegex(searchTerm), $options: 'i' } },
        { hotelName: { $regex: escapeRegex(searchTerm), $options: 'i' } },
        { destination: { $regex: escapeRegex(searchTerm), $options: 'i' } },
      ]
    };

    const apiStyleResults = await hotelModel.find(apiStyleFilter).select('hotelName city state rooms').lean();
    console.log(`🌐 API-style search for "${searchTerm}": ${apiStyleResults.length} hotels found`);
    apiStyleResults.forEach((hotel, idx) => {
      console.log(`  ${idx + 1}. ${hotel.hotelName} (${hotel.city}, ${hotel.state})`);
      console.log(`     Total rooms: ${hotel.rooms?.length || 0}`);
    });
    console.log('');

    // Test 5: Check if any hotels have rooms
    const hotelsWithRooms = await hotelModel.find({
      isAccepted: true,
      'rooms.0': { $exists: true }
    }).countDocuments();
    
    console.log(`🏨 Accepted hotels with at least one room: ${hotelsWithRooms}`);
    
    // Test 6: Sample a few hotels to see their structure
    const sampleHotels = await hotelModel.find({ isAccepted: true }).limit(3).select('hotelName city rooms').lean();
    console.log(`\n📋 Sample hotel structure (first 3 accepted hotels):`);
    sampleHotels.forEach((hotel, idx) => {
      console.log(`\n  ${idx + 1}. ${hotel.hotelName} (${hotel.city})`);
      console.log(`     Rooms count: ${hotel.rooms?.length || 0}`);
      if (hotel.rooms && hotel.rooms.length > 0) {
        console.log(`     First room: roomId=${hotel.rooms[0].roomId}, type=${hotel.rooms[0].type}, price=${hotel.rooms[0].price}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testHotelSearch();
