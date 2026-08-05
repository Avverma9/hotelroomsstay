const mongoose = require('mongoose');
require('dotenv').config();

const SidebarLink = require('../models/additionalSettings/sidebarLink');

async function checkComplaintLinks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const links = await SidebarLink.find({
      $or: [
        { parentLink: { $regex: 'complaint', $options: 'i' } },
        { childLink: { $regex: 'complaint', $options: 'i' } },
        { label: { $regex: 'complaint', $options: 'i' } }
      ]
    }).lean();

    console.log('\n=== EXISTING COMPLAINT SIDEBAR LINKS ===\n');
    console.log(JSON.stringify(links, null, 2));
    console.log(`\n=== Total: ${links.length} links ===\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkComplaintLinks();
