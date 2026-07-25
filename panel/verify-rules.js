/**
 * Quick verification script for panel booking rules
 * Run: node verify-rules.cjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`✗ File not found: ${filePath}`, colors.red);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  let allPassed = true;

  checks.forEach(check => {
    const found = content.includes(check.text);
    if (found === check.expected) {
      log(`  ✓ ${check.name}`, colors.green);
    } else {
      log(`  ✗ ${check.name}`, colors.red);
      allPassed = false;
    }
  });

  return allPassed;
}

log('\n🔍 Verifying Panel Booking Rules Integration\n', colors.cyan);

// Check 1: pms-booking.jsx has updated status transition logic
log('📄 Checking: src/pages/pms/pms-booking.jsx', colors.yellow);
const pmsChecks = [
  {
    name: 'Hotel partners cannot cancel Confirmed bookings',
    text: "return ['Confirmed', 'Checked-in', 'No-Show']",
    expected: true
  },
  {
    name: 'Hotel partners cannot cancel Checked-in bookings',
    text: "return ['Checked-in', 'Checked-out']",
    expected: true
  },
  {
    name: 'Comment explaining new restrictions',
    text: '// Operations roles (hotel partners) - NEW RESTRICTIONS',
    expected: true
  },
  {
    name: 'Admin/Developer still have full access',
    text: 'if (capabilities.isPrivileged)',
    expected: true
  }
];

const pmsPass = checkFile('src/pages/pms/pms-booking.jsx', pmsChecks);

log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);

if (pmsPass) {
  log('\n✅ All checks passed!', colors.green);
  log('Panel is ready for smoke testing.\n', colors.green);
  
  log('Next steps:', colors.cyan);
  log('1. Start dev server: npm run dev', colors.yellow);
  log('2. Login as hotel partner', colors.yellow);
  log('3. Try to cancel a Confirmed booking', colors.yellow);
  log('4. Verify "Cancelled" is NOT in dropdown\n', colors.yellow);
  
  process.exit(0);
} else {
  log('\n❌ Some checks failed!', colors.red);
  log('Please review the changes in panel/PANEL_CHANGES.md\n', colors.red);
  process.exit(1);
}
