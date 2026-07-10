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
 * GET /travel/get-ride-history/car/:carId
 * Returns all *completed* bookings for a given car.
 * Falls back to getBookingsByCar with status=Completed if no dedicated endpoint exists.
 */
export async function getCarRideHistory(carId: string, page = 1, limit = 30): Promise<BookingsByCarResponse> {
  try {
    const result = await getBookingsByCar(carId, { status: "Completed", page, limit });
    return result;
  } catch (err: any) {
    if (err?.response?.status === 404) return { bookings: [], total: 0, page, limit, car: {} as Car };
    throw err;
  }
}
