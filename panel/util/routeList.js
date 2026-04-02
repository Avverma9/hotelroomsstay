/**
 * ROUTE LIST — Single source of truth for all application routes.
 * Used by manage-route-access.jsx for per-user route permissions.
 *
 * Fields per route:
 *   path        — exact React Router path string
 *   label       — human-readable display name
 *   description — short one-liner describing the page
 *   groupKey    — key that matches a ROUTE_GROUP entry
 *   isDynamic   — true when the path contains :param segments
 *   isAdmin     — true when the route is admin-only by nature
 */

const createRoute = (
  path,
  label,
  description,
  groupKey,
  isDynamic = false,
  isAdmin = false
) => ({
  path,
  label,
  description,
  groupKey,
  isDynamic,
  isAdmin,
})

/* ── General ───────────────────────────────────────────── */
const GENERAL_ROUTES = [
  createRoute('/dashboard', 'Dashboard', 'Main overview & stats', 'general'),
  createRoute('/messenger', 'Messenger', 'Real-time chat between users', 'general'),
]

/* ── User Management ───────────────────────────────────── */
const USER_ROUTES = [
  createRoute('/user', 'All Partners / Users', 'List of all dashboard users & partners', 'users'),
  createRoute('/all-users', 'All Users', 'List of all users', 'users'),
]

/* ── Admin ─────────────────────────────────────────────── */
const ADMIN_ROUTES = [
  createRoute('/manage-menu', 'Manage Sidebar Links', 'Add / edit / remove sidebar navigation links', 'admin', false, true),
  createRoute('/admin/coupon', 'Coupon Management', 'Create and manage discount coupons', 'admin', false, true),
  createRoute('/additional-fields', 'Additional Data Fields', 'Configure extra metadata fields', 'admin', false, true),
  createRoute('/gst-management', 'GST Management', 'Configure GST slabs and settings', 'admin', false, true),
  createRoute('/gst-page', 'GST Page (View)', 'Read-only GST overview page', 'admin', false, true),
  createRoute('/hotel-bookings', 'Hotel Bookings (Admin)', 'Admin view of all hotel bookings', 'admin', false, true),
  createRoute('/hotels', 'All Hotels', 'Admin view of all hotels', 'admin', false, true),
  createRoute('/hotels/:id', 'Hotel Details', 'Detailed view of a specific hotel by hotelId', 'admin', true, true),
  createRoute('/manage-route-access', 'Manage Route Access', 'Grant / revoke route-level access per user', 'admin', false, true),
createRoute('/admin-cabs', 'All Cabs', 'Admin view of all cars in TMS', 'admin', false, true),
createRoute('/apply-pms-coupon', 'Apply PMS Coupon', 'Apply a coupon in PMS', 'admin', false, true),
createRoute('/admin-notification', 'Push Notifications', 'Admin view of all notifications', 'admin', false, true),
  createRoute('/all-hotel-reviews', 'All Hotel Reviews', 'View and manage all hotel reviews submitted by users', 'admin', false, true),
  createRoute('/admin-new-hotel', 'Add New Hotel', 'Create a new hotel entry', 'admin', false, true),
]

/* ── PMS — Bookings ────────────────────────────────────── */
const PMS_ROUTES = [
  createRoute('/your-bookings', 'PMS Bookings', 'PMS: personal hotel booking list', 'pms'),
  createRoute('/your-complaints', 'PMS Complaints', 'PMS: personal complaint list', 'pms'),
  createRoute('/panel-booking', 'Panel Booking', 'PMS: panel-level booking management', 'pms'),
  createRoute('/your-hotels', 'Your Hotels', 'PMS: hotels owned by the logged-in user', 'pms'),
  createRoute('/your-hotels/:id', 'Your Hotel Details', 'PMS: detail view of a hotel owned by the logged-in user', 'pms', true),
]

/* ── Booking Creation ──────────────────────────────────── */
const BOOKING_ROUTES = [
  createRoute('/booking-creation', 'Find User', 'Step 1: search / identify a guest', 'booking'),
  createRoute('/booking-creation/hotels', 'Select Hotel', 'Step 2: pick a hotel for the booking', 'booking'),
  createRoute('/booking-creation/create-user', 'Create New Guest', 'Step 2b: register a new guest profile', 'booking'),
  createRoute('/booking-creation/book-hotel', 'Book Hotel', 'Step 3: confirm & submit the booking', 'booking'),
]

/* ── TMS — Cars ────────────────────────────────────────── */
const CAR_ROUTES = [
  createRoute('/add-a-car', 'Add a Car', 'Register a new vehicle in TMS', 'cars'),
  createRoute('/your-cars', 'Your Cars', 'List of vehicles you own/manage', 'cars'),
  createRoute('/your-cars/:id', 'View Car', 'Detail view of a specific vehicle', 'cars', true),
  createRoute('/your-cars/:id/edit', 'Edit Car', 'Edit vehicle details', 'cars', true),
  createRoute('/cars-owner', 'Cars Owner', 'Manage vehicle ownership records', 'cars'),
  createRoute('/travel-bookings', 'Travel Bookings', 'Car/travel booking list for your vehicles', 'cars'),
  createRoute('/car-booking', 'All Cars (Browse)', 'Browse all available cars for booking', 'cars'),
  createRoute('/admin-travel-bookings', 'Admin: All Travel Bookings', 'Admin view of all travel/car bookings', 'cars', false, true),
]

/* ── TMS — Tours ───────────────────────────────────────── */
const TOUR_ROUTES = [
  createRoute('/tours-book', 'Browse & Book Tours', 'Explore tour packages and book seats with GST pricing', 'tours'),
  createRoute('/tours/:id', 'Browse & Book Tours', 'Explore tour packages and book seats with GST pricing', 'tours', true),
  createRoute('/add-tour-data', 'Add Tour Package', 'Create a new tour package listing', 'tours'),
  createRoute('/my-tour', 'My Tours', 'Tour packages linked to your agency', 'tours'),
  createRoute('/my-tour/:id', 'View Tour', 'Detail page for a specific tour package', 'tours', true),
  createRoute('/my-tour/:id/edit', 'Edit Tour', 'Edit a tour package', 'tours', true),
  createRoute('/tour-booking/:id', 'Book Tour', 'Multi-step tour booking: seat selection, passenger details and GST pricing', 'tours', true),
  
  createRoute('/admin/tour-bookings', 'All Tour Bookings', 'Admin view of all tour bookings across all agencies', 'tours', false, true),
  createRoute('/tour-request', 'Admin Tour Requests', 'Admin Requests of all tour packages', 'tours', false, true),
  createRoute('/tour-list', 'Admin Tour List', 'Admin List of all tour packages', 'tours', false, true),

]

/* ── Complaints ────────────────────────────────────────── */
const COMPLAINT_ROUTES = [
  createRoute('/complaints', 'All Complaints', 'Admin view of all hotel complaints', 'complaints', false, true),
  createRoute('/complaint/create', 'File a Complaint', 'Submit a new complaint about a hotel', 'complaints'),
  createRoute('/complaint/chat/:id', 'Complaint Chat', 'Chat support for a specific complaint', 'complaints', true),
  createRoute('/my-complaints', 'My Complaints', 'View and track complaints filed by the logged-in user', 'complaints'),
  createRoute('/user-complaint', 'User Complaints', 'View and track complaints filed by the logged-in user', 'complaints'),
]

/* ── Flat Route List ───────────────────────────────────── */
export const ROUTE_LIST = [
  ...GENERAL_ROUTES,
  ...USER_ROUTES,
  ...ADMIN_ROUTES,
  ...PMS_ROUTES,
  ...BOOKING_ROUTES,
  ...CAR_ROUTES,
  ...TOUR_ROUTES,
  ...COMPLAINT_ROUTES,
]

/* ── Group Metadata ────────────────────────────────────── */
export const ROUTE_GROUPS = [
  {
    key: 'general',
    label: 'General',
    color: 'bg-violet-100 text-violet-700',
    borderColor: 'border-violet-200',
  },
  {
    key: 'users',
    label: 'User Management',
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-200',
  },
  {
    key: 'admin',
    label: 'Admin',
    color: 'bg-rose-100 text-rose-700',
    borderColor: 'border-rose-200',
  },
  {
    key: 'pms',
    label: 'PMS — Bookings',
    color: 'bg-amber-100 text-amber-700',
    borderColor: 'border-amber-200',
  },
  {
    key: 'booking',
    label: 'Booking Creation',
    color: 'bg-teal-100 text-teal-700',
    borderColor: 'border-teal-200',
  },
  {
    key: 'cars',
    label: 'TMS — Cars',
    color: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-200',
  },
  {
    key: 'tours',
    label: 'TMS — Tours',
    color: 'bg-emerald-100 text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  {
    key: 'complaints',
    label: 'Complaints',
    color: 'bg-rose-100 text-rose-700',
    borderColor: 'border-rose-200',
  },
]

/**
 * Returns ROUTE_LIST grouped by ROUTE_GROUPS order.
 * Each entry: { key, label, color, borderColor, routes: [...] }
 */
export const getGroupedRoutes = () => {
  const byKey = {}

  for (const route of ROUTE_LIST) {
    if (!byKey[route.groupKey]) byKey[route.groupKey] = []
    byKey[route.groupKey].push(route)
  }

  const result = ROUTE_GROUPS
    .filter((group) => byKey[group.key]?.length)
    .map((group) => ({
      ...group,
      routes: byKey[group.key],
    }))

  const knownKeys = new Set(ROUTE_GROUPS.map((group) => group.key))
  const ungrouped = ROUTE_LIST.filter((route) => !knownKeys.has(route.groupKey))

  if (ungrouped.length) {
    result.push({
      key: 'other',
      label: 'Other',
      color: 'bg-slate-100 text-slate-600',
      borderColor: 'border-slate-200',
      routes: ungrouped,
    })
  }

  return result
}

/** Flat list of all paths — useful for "all paths" sets */
export const ALL_ROUTE_PATHS = ROUTE_LIST.map((route) => route.path)
