// ===== ENUMS =====
export type Role = "admin" | "user";

// ===== USER =====
export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// ===== TRIP =====
export interface Trip {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  budget?: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripWithDetails extends Trip {
  stops?: Stop[];
  participants?: TripParticipant[];
}

export interface TripParticipant {
  id: string;
  tripId: string;
  userId: string;
  joinedAt: string;
}

// ===== STOP =====
export interface Stop {
  id: string;
  tripId: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  arrivalDate?: string | null;
  departureDate?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ===== NOTE =====
export interface Note {
  id: string;
  tripId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ===== EXPENSE =====
export interface Expense {
  id: string;
  tripId: string;
  authorId: string;
  amount: number;
  category?: string | null;
  description?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// ===== API RESPONSE =====
export interface ApiResponse<T> {
  status: "ok" | "error";
  data?: T;
  error?: string;
  details?: Array<{ path: string[]; message: string }>;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: { limit: number; offset: number };
}
