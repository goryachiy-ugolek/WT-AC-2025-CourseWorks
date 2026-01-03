import api from "./client";
import type { ApiResponse, PaginatedData, Trip, TripWithDetails } from "../types";

export interface CreateTripDto {
  title: string;
  description?: string;
  startDate: string; // ISO datetime
  endDate: string;
  budget?: number;
}

export interface UpdateTripDto extends Partial<CreateTripDto> {}

export interface ListTripsParams {
  ownerId?: string;
  participantId?: string;
  limit?: number;
  offset?: number;
}

export const tripsApi = {
  list: async (params?: ListTripsParams): Promise<PaginatedData<Trip>> => {
    const response = await api.get<ApiResponse<PaginatedData<Trip>>>("/trips", { params });
    return response.data.data!;
  },

  get: async (id: string): Promise<TripWithDetails> => {
    const response = await api.get<ApiResponse<{ trip: TripWithDetails }>>(`/trips/${id}`);
    return response.data.data!.trip;
  },

  create: async (dto: CreateTripDto): Promise<Trip> => {
    const response = await api.post<ApiResponse<{ trip: Trip }>>("/trips", dto);
    return response.data.data!.trip;
  },

  update: async (id: string, dto: UpdateTripDto): Promise<Trip> => {
    const response = await api.put<ApiResponse<{ trip: Trip }>>(`/trips/${id}`, dto);
    return response.data.data!.trip;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/trips/${id}`);
  },

  share: async (tripId: string, userId: string): Promise<void> => {
    await api.post(`/trips/${tripId}/share`, { userId });
  },

  removeParticipant: async (tripId: string, userId: string): Promise<void> => {
    await api.delete(`/trips/${tripId}/participants/${userId}`);
  },
};
