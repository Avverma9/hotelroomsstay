import { create as createAxios } from "axios";
import { baseUrl } from "./url";
import { storageGet } from "./storage";

export const TOKEN_KEY = "auth_token";

// --- Local Auth Backend ---
export const authApi = createAxios({
  baseURL: baseUrl,
  timeout: 15000,
});

authApi.interceptors.request.use(async (config) => {
  const token = await storageGet(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  // --- DEBUG LOG ---
  undefined;
  return config;
});

// --- External Travel API ---
export const travelApi = createAxios({
  baseURL: `${baseUrl}/travel`,
  timeout: 20000,
});

travelApi.interceptors.request.use(async (config) => {
  const token = await storageGet(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  
  
  return config;
});

export type LoginResponse = {
  message: string;
  loggedUserRole: string;
  loggedUserStatus: boolean;
  loggedUserImage: string[];
  loggedUserId: string;
  loggedUserName: string;
  loggedUserEmail: string;
  rsToken: string;
  refreshToken: string;
  sessionData: any;
};

export async function login(email: string, password: string) {
  const { data } = await authApi.post<LoginResponse>("/login/dashboard/user", {
    email,
    password,
  });
  return data;
}

export async function register(params: {
  email: string;
  password: string;
  name: string;
  mobile: string;
}) {
  const { data } = await authApi.post<any>(
    "/create/dashboard/user",
    params,
  );
  return data;
}

export async function fetchMe(userId: string) {
  const { data } = await authApi.get(`/login/dashboard/get/all/user/${userId}`);
  return data;
}

// --- Travel endpoints ---
export type Seat = {
  _id: string;
  seatType: string;
  seatNumber: number;
  seatPrice: number;
  isBooked: boolean;
  bookedBy?: string;
};

export type Car = {
  _id: string;
  make: string;
  model: string;
  vehicleNumber?: string;
  vehicleType: "Bike" | "Car" | "Bus";
  sharingType: "Private" | "Shared";
  images?: string[];
  year?: number;
  pickupP?: string;
  dropP?: string;
  seater?: number;
  runningStatus?: string;
  seatConfig?: Seat[];
  extraKm?: number;
  perPersonCost?: number;
  pickupD?: string;
  dropD?: string;
  price?: number;
  color?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  ownerId?: string;
  isAvailable?: boolean;
};

export type Booking = {
  _id: string;
  bookingId: string;
  carId: string;
  userId: string;
  passengerName?: string;
  customerMobile: string;
  customerEmail: string;
  bookedBy?: string;
  vehicleType?: string;
  sharingType?: string;
  vehicleNumber?: string;
  make?: string;
  model?: string;
  color?: string;
  pickupP?: string;
  dropP?: string;
  pickupD?: string;
  dropD?: string;
  seats?: any[];
  totalSeatsBooked?: number;
  basePrice?: number;
  gstAmount?: number;
  price?: number;
  paymentMethod?: string;
  paymentId?: string;
  isPaid?: boolean;
  bookingStatus?: string;
  rideStatus?: string;
  pickupCode?: string;
  dropCode?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  cancellationReason?: string;
  bookingDate?: string;
  createdAt?: string;
  rideStartedAt?: string;
  rideCompletedAt?: string;
  carDetails?: any;
  totalSeatPrice?: number;
  availableSeatsOnCar?: any[];
  pickupCodeVerifiedAt?: string;
  dropCodeVerifiedAt?: string;
};

export async function getAllCars() {
  const { data } = await travelApi.get<Car[]>("/get-all-car");
  return data;
}

export async function filterCars(params: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && `${v}`.trim() !== "") cleaned[k] = v;
  });
  const { data } = await travelApi.get<Car[]>("/filter-car/by-query", {
    params: cleaned,
  });
  return data;
}

export async function getCarById(id: string) {
  const { data } = await travelApi.get<Car>(`/get-a-car/${id}`);
  return data;
}

export async function getSeatData(id: string) {
  const { data } = await travelApi.get<{ carId: string; seats: Seat[] }>(
    `/get-seat-data/by-id/${id}`,
  );
  return data;
}

export async function createBooking(body: Record<string, any>) {
  const { data } = await travelApi.post("/create-travel/booking", body);
  return data as { success: boolean; message: string; data: Booking };
}

export async function getMyBookings(userId: string) {
  const { data } = await travelApi.get<Booking[]>(
    `/get-bookings-by/user/${userId}`,
  );
  return data;
}

export async function getBookingsByMobile(customerMobile: string) {
  const { data } = await travelApi.post<Booking[]>(
    "/get-bookings-by/bookedBy",
    { customerMobile },
  );
  return data;
}

// ── Rider (Owner) APIs ────────────────────────────────────────
/**
 * GET /travel/get-my-cars — returns cars for the authenticated owner.
 * This is used by the rider/profile screen to show the owner's assigned cars.
 */
export async function getMyCars() {
  try {
    const { data } = await travelApi.get<Car[]>('/get-my-cars');
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 403 || err?.response?.status === 401) {
      return [];
    }
    throw err;
  }
}

export type OwnerAvailability = {
  _id: string;
  ownerId: string;
  carId?: string;
  startDate: string;
  endDate: string;
  mode: 'available' | 'unavailable';
  note?: string;
};

/** GET /travel/owner-availability?ownerId=...&dateFrom=...&dateTo=... */
export async function getOwnerAvailability(ownerId?: string, params?: { dateFrom?: string; dateTo?: string }) {
  const qs: Record<string, any> = {};
  if (ownerId) qs.ownerId = ownerId;
  if (params?.dateFrom) qs.dateFrom = params.dateFrom;
  if (params?.dateTo) qs.dateTo = params.dateTo;
  const { data } = await travelApi.get<{ success: boolean; availability: OwnerAvailability[] }>('/owner-availability', {
    params: qs,
  });
  return data;
}

/** POST /travel/owner-availability (auth) */
export async function addOwnerAvailability(body: { startDate: string; endDate: string; mode?: 'available' | 'unavailable'; carId?: string; note?: string; }) {
  const { data } = await travelApi.post('/owner-availability', body);
  return data as { success: boolean; availability: OwnerAvailability };
}

/** DELETE /travel/owner-availability/:id (auth) */
export async function deleteOwnerAvailability(id: string) {
  const { data } = await travelApi.delete(`/owner-availability/${id}`);
  return data as { success: boolean; message: string };
}

/**
 * GET /travel/get-bookings-by/owner/:ownerId
 * Fetches bookings for the cars of the currently authenticated owner.
 * The backend uses the JWT token to identify the owner, so the ownerId param is technically redundant but kept for consistency.
 * A dedicated `/get-my-bookings` endpoint would be a cleaner approach in the future.
 */
export async function getOwnerBookings(userId: string) {
  try {
    // Pass the user's ID, but rely on the token-based authentication on the backend.
    const { data } = await travelApi.get<Booking[]>(`/get-bookings-by/owner/${userId}`);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
}

/** PATCH /travel/update-a-car/:id — update car fields (no images) */
export async function updateCar(id: string, body: Partial<Car>) {
  const { data } = await travelApi.patch(`/update-a-car/${id}`, body);
  return data as { success?: boolean; message?: string; car?: Car } & Car;
}

/**
 * GET /travel/get-bookings-by/car/:carId
 * Returns paginated bookings for a specific car — owner-verified via JWT.
 * Supports optional filters: status, dateFrom (ISO), dateTo (ISO), page, limit.
 */
export type BookingsByCarResponse = {
  bookings: (Booking & { seatDetails?: Seat[] })[];
  total: number;
  page: number;
  limit: number;
  car: Car;
};

export type RideHistoryEvent = {
  _id: string;
  eventType: "NEW_RIDE" | "ROUTE_CHANGED";
  bookingId?: string;
  bookingCode?: string;
  route?: {
    pickupP?: string;
    dropP?: string;
    pickupD?: string;
    dropD?: string;
  };
  previousRoute?: {
    pickupP?: string;
    dropP?: string;
    pickupD?: string;
    dropD?: string;
  };
  newRoute?: {
    pickupP?: string;
    dropP?: string;
    pickupD?: string;
    dropD?: string;
  };
  source?: "BOOKING" | "CAR_UPDATE" | "SYSTEM";
  createdAt?: string;
};

export type RideHistoryByCarResponse = {
  car: Car;
  page: number;
  limit: number;
  total: number;
  items: RideHistoryEvent[];
  stats: {
    totalEvents: number;
    newRideCount: number;
    routeChangeCount: number;
  };
};
export async function getBookingsByCar(
  carId: string,
  params?: { status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }
) {
  const { data } = await travelApi.get<BookingsByCarResponse>(
    `/get-bookings-by/car/${carId}`,
    { params }
  );
  return data;
}

/**
 * PATCH /travel/release-seat/:carId
 * Manually releases a booked seat — owner-verified via JWT.
 */
export async function releaseSeat(carId: string, seatId: string) {
  const { data } = await travelApi.patch(`/release-seat/${carId}`, { seatId });
  return data as { message: string; car: Car };
}

/** POST /travel/add-a-car */
export async function addCar(body: Record<string, any>) {
  const { data } = await travelApi.post("/add-a-car", body);
  return data as { message: string; car: Car };
}

/** PATCH /travel/change-booking-status/:id */
export async function changeBookingStatus(bookingId: string, bookingStatus: string) {
  const { data } = await travelApi.patch(`/change-booking-status/${bookingId}`, { bookingStatus });
  return data as { message: string; booking: Booking };
}

/** POST /travel/verify-pickup-code/:id */
export async function verifyPickupCode(bookingId: string, pickupCode: string) {
  const { data } = await travelApi.post(`/verify-pickup-code/${bookingId}`, { pickupCode });
  return data as { message: string; booking: Booking };
}

/** POST /travel/verify-drop-code/:id */
export async function verifyDropCode(bookingId: string, dropCode: string) {
  const { data } = await travelApi.post(`/verify-drop-code/${bookingId}`, { dropCode });
  return data as { message: string; booking: Booking };
}

/**
 * Check whether a car has active bookings that overlap [pickupD, dropD].
 * Returns the same shape as getBookingsByCar but only fetches the overlap window.
 * Returns [] (empty) on 404 / no-data.
 */
export async function checkCarOverlap(
  carId: string,
  pickupD: string,
  dropD: string
): Promise<Booking[]> {
  try {
    const result = await getBookingsByCar(carId, { dateFrom: pickupD, dateTo: dropD });
    return Array.isArray(result?.bookings) ? result.bookings : [];
  } catch (err: any) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
}

/**
 * GET /travel/get-ride-history/by-car/:carId
 * Returns car-level ride history events, separate from booking history.
 */
export async function getCarRideHistory(carId: string, page = 1, limit = 30): Promise<RideHistoryByCarResponse> {
  try {
    const { data } = await travelApi.get<RideHistoryByCarResponse>(
      `/get-ride-history/by-car/${carId}`,
      { params: { page, limit } },
    );
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return {
        car: {} as Car,
        page,
        limit,
        total: 0,
        items: [],
        stats: { totalEvents: 0, newRideCount: 0, routeChangeCount: 0 },
      };
    }
    throw err;
  }
}
