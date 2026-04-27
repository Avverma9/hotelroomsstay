import axios from "axios";
import { baseUrl } from "./url";
import { storageGet } from "./storage";

export const TOKEN_KEY = "auth_token";

// --- Local Auth Backend ---
export const authApi = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
});

authApi.interceptors.request.use(async (config) => {
  const token = await storageGet(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- External Travel API ---
export const travelApi = axios.create({
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
    "/auth/register",
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
/** GET /travel/get-a-car/by-owner/:ownerId — returns cars for the given owner _id */
export async function getMyCars(ownerId: string) {
  try {
    const { data } = await travelApi.get<Car[]>(`/get-a-car/by-owner/${ownerId}`);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    // 404 means no cars yet — treat as empty list
    if (err?.response?.status === 404) return [];
    throw err;
  }
}

/** GET /travel/get-bookings-by/owner/:ownerId */
export async function getOwnerBookings(ownerId: string) {
  try {
    const { data } = await travelApi.get<Booking[]>(`/get-bookings-by/owner/${ownerId}`);
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
