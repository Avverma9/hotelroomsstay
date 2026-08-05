const mongoose = require('mongoose');
require('dotenv').config();

const SidebarLink = require('../models/additionalSettings/sidebarLink');

async function addComplaintSidebarLinks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check existing complaint links
    const existingLinks = await SidebarLink.find({
      $or: [
        { childLink: '/complaint/user/create' },
        { childLink: '/complaint/admin/create' },
        { childLink: '/file-complaint' }
      ]
    }).lean();

    console.log('\n=== EXISTING COMPLAINT LINKS ===');
    console.log(`Found ${existingLinks.length} existing complaint links`);
    existingLinks.forEach(link => {
      console.log(`- ${link.parentLink} > ${link.childLink} (${link.label}) [${link.role.join(', ')}]`);
    });

    // New sidebar links to add
    const newLinks = [
      {
        parentLink: 'Complaints',
        childLink: '/file-complaint',
        label: 'File Complaint',
        isParentOnly: false,
        icon: 'FileText',
        status: 'active',
        role: ['Admin', 'Developer', 'PMS', 'TMS', 'CA', 'Rider'], // All roles can file complaints
        order: 1
      },
      {
        parentLink: 'Complaints',
        childLink: '/complaint/user/create',
        label: 'User Complaint',
        isParentOnly: false,
        icon: 'User',
        status: 'active',
        role: ['Admin', 'Developer', 'PMS', 'TMS', 'CA', 'Rider'], // All roles
        order: 2
      },
      {
        parentLink: 'Complaints',
        childLink: '/complaint/admin/create',
        label: 'Admin Complaint',
        isParentOnly: false,
        icon: 'UserCog',
        status: 'active',
        role: ['Admin', 'Developer'], // Only Admin and Developer
        order: 3
      },
      {
        parentLink: 'Complaints',
        childLink: '/user-complaint',
        label: 'All Complaints',
        isParentOnly: false,
        icon: 'List',
        status: 'active',
        role: ['Admin', 'Developer', 'PMS', 'TMS', 'CA', 'Rider'],
        order: 4
      },
      {
        parentLink: 'Complaints',
        childLink: '/your-complaints',
        label: 'Your Complaints',
        isParentOnly: false,
        icon: 'MessageSquare',
        status: 'active',
        role: ['Admin', 'Developer', 'PMS', 'TMS', 'CA', 'Rider'],
        order: 5
      }
    ];

    console.log('\n=== ADDING NEW COMPLAINT LINKS ===');
    
    // Check which links already exist
    const linksToAdd = [];
    for (const newLink of newLinks) {
      const exists = existingLinks.some(link => link.childLink === newLink.childLink);
      if (exists) {
        console.log(`⏭️  SKIPPED: ${newLink.childLink} (already exists)`);
      } else {
        linksToAdd.push(newLink);
        console.log(`➕ TO ADD: ${newLink.childLink} - ${newLink.label}`);
      }
    }

    if (linksToAdd.length > 0) {
      const created = await SidebarLink.insertMany(linksToAdd);
      console.log(`\n✅ Successfully added ${created.length} new complaint sidebar links!`);
      
      created.forEach(link => {
        console.log(`   - ${link.parentLink} > ${link.childLink} (${link.label}) [${link.role.join(', ')}]`);
      });
    } else {
      console.log('\n⚠️  No new links to add. All complaint routes already exist in sidebar.');
    }

    console.log('\n=== FINAL COMPLAINT SIDEBAR STRUCTURE ===');
    const allComplaintLinks = await SidebarLink.find({
      parentLink: 'Complaints'
    }).sort({ order: 1 }).lean();
    
    console.log(`\nComplaint Menu (${allComplaintLinks.length} items):`);
    allComplaintLinks.forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link.label} → ${link.childLink}`);
      console.log(`     Roles: ${link.role.join(', ')}`);
      console.log(`     Status: ${link.status}\n`);
    });

    await mongoose.disconnect();
    console.log('✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addComplaintSidebarLinks();
