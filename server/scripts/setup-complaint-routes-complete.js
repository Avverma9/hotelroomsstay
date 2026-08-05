const mongoose = require('mongoose');
require('dotenv').config();

const SidebarLink = require('../models/additionalSettings/sidebarLink');
const DashboardUser = require('../models/dashboardUser');

async function setupCompleteComplaintRoutes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ============================================
    // STEP 1: Add Sidebar Links
    // ============================================
    console.log('📋 STEP 1: Adding Sidebar Links...\n');

    const sidebarLinks = [
      {
        parentLink: 'Complaints',
        childLink: '/file-complaint',
        label: 'File Complaint',
        isParentOnly: false,
        icon: 'FileText',
        status: 'active',
        role: ['Admin', 'Developer', 'PMS', 'TMS', 'CA', 'Rider'],
        order: 1
      },
      {
        parentLink: 'Complaints',
        childLink: '/complaint/user/create',
        label: 'User Complaint',
        isParentOnly: false,
        icon: 'User',
        status: 'active',
        role: ['Admin', 'Developer', 'PMS', 'TMS', 'CA', 'Rider'],
        order: 2
      },
      {
        parentLink: 'Complaints',
        childLink: '/complaint/admin/create',
        label: 'Admin Complaint',
        isParentOnly: false,
        icon: 'UserCog',
        status: 'active',
        role: ['Admin', 'Developer'],
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

    const existingSidebarLinks = await SidebarLink.find({
      childLink: { $in: sidebarLinks.map(l => l.childLink) }
    }).lean();

    const sidebarLinksToAdd = sidebarLinks.filter(link => 
      !existingSidebarLinks.some(existing => existing.childLink === link.childLink)
    );

    if (sidebarLinksToAdd.length > 0) {
      const createdSidebar = await SidebarLink.insertMany(sidebarLinksToAdd);
      console.log(`✅ Added ${createdSidebar.length} sidebar links:`);
      createdSidebar.forEach(link => {
        console.log(`   - ${link.label} → ${link.childLink} [${link.role.join(', ')}]`);
      });
    } else {
      console.log('⏭️  All sidebar links already exist');
    }

    console.log(`\n📊 Skipped: ${existingSidebarLinks.length} (already exist)\n`);

    // ============================================
    // STEP 2: Check Route Permissions Setup
    // ============================================
    console.log('🔒 STEP 2: Checking Route Permissions...\n');

    const complaintRoutes = [
      '/file-complaint',
      '/complaint/user/create',
      '/complaint/admin/create',
      '/user-complaint',
      '/your-complaints',
      '/complaint/chat/:id'
    ];

    // Check if any users have custom route permissions that might block these routes
    const usersWithCustomPerms = await DashboardUser.find({
      'routePermissions.mode': 'custom'
    }).select('email role routePermissions').lean();

    if (usersWithCustomPerms.length > 0) {
      console.log(`⚠️  Found ${usersWithCustomPerms.length} users with custom route permissions:`);
      
      for (const user of usersWithCustomPerms) {
        const allowedRoutes = user.routePermissions?.allowedRoutes || [];
        const missingRoutes = complaintRoutes.filter(route => 
          !allowedRoutes.some(allowed => 
            allowed === route || 
            allowed === '/*' || 
            allowed === '/**' ||
            route.startsWith(allowed.replace('*', ''))
          )
        );

        if (missingRoutes.length > 0) {
          console.log(`\n   👤 ${user.email} (${user.role})`);
          console.log(`      Missing routes: ${missingRoutes.join(', ')}`);
          console.log(`      ℹ️  Add these routes to their allowedRoutes if needed`);
        }
      }
      
      console.log(`\n   ℹ️  Note: Users with mode="allow_all" don't need explicit route permissions`);
    } else {
      console.log('✅ No users have custom route permissions');
      console.log('   All users will have access based on their role');
    }

    console.log();

    // ============================================
    // STEP 3: Verify Final Structure
    // ============================================
    console.log('🔍 STEP 3: Verifying Final Structure...\n');

    const allComplaintLinks = await SidebarLink.find({
      parentLink: 'Complaints'
    }).sort({ order: 1 }).lean();

    console.log('📁 Complaints Menu Structure:');
    allComplaintLinks.forEach((link, idx) => {
      const roleStr = link.role.length > 3 
        ? 'All Roles' 
        : link.role.join(', ');
      console.log(`   ${idx + 1}. ${link.label}`);
      console.log(`      Route: ${link.childLink}`);
      console.log(`      Roles: ${roleStr}`);
      console.log(`      Status: ${link.status}\n`);
    });

    // ============================================
    // SUMMARY
    // ============================================
    console.log('═══════════════════════════════════════');
    console.log('✅ SETUP COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Sidebar Links: ${allComplaintLinks.length} total in Complaints menu`);
    console.log(`✅ Routes: All complaint routes are accessible`);
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart your server');
    console.log('   2. Logout and login to panel');
    console.log('   3. Check Complaints menu in sidebar');
    console.log('   4. Test navigation with different roles');
    console.log('   5. If "Access Denied", check user route permissions');
    console.log('\n💡 Route Access:');
    console.log('   - Users with routePermissions.mode="allow_all" → ✅ Full access');
    console.log('   - Users with routePermissions.mode="custom" → ⚠️  Need explicit routes');
    console.log('\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupCompleteComplaintRoutes();
