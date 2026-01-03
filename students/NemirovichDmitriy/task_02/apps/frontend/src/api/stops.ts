import api from "./client";
import type { ApiResponse, Stop } from "../types";

export interface CreateStopDto {
  tripId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  arrivalDate?: string;
  departureDate?: string;
  order: number;
}

export interface UpdateStopDto extends Partial<Omit<CreateStopDto, "tripId">> {}

export const stopsApi = {
  list: async (tripId: string): Promise<Stop[]> => {
    const response = await api.get<ApiResponse<{ items: Stop[] }>>("/stops", {
      params: { tripId },
    });
    return response.data.data!.items;
  },

  get: async (id: string): Promise<Stop> => {
    const response = await api.get<ApiResponse<{ stop: Stop }>>(`/stops/${id}`);
    return response.data.data!.stop;
  },

  create: async (dto: CreateStopDto): Promise<Stop> => {
    const response = await api.post<ApiResponse<{ stop: Stop }>>("/stops", dto);
    return response.data.data!.stop;
  },

  update: async (id: string, dto: UpdateStopDto): Promise<Stop> => {
    const response = await api.put<ApiResponse<{ stop: Stop }>>(`/stops/${id}`, dto);
    return response.data.data!.stop;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/stops/${id}`);
  },
};
