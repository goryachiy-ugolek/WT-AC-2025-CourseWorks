import api from "./client";
import type { ApiResponse, Note, PaginatedData } from "../types";

export interface CreateNoteDto {
  tripId: string;
  content: string;
}

export interface UpdateNoteDto {
  content: string;
}

export interface ListNotesParams {
  tripId: string;
  limit?: number;
  offset?: number;
}

export const notesApi = {
  list: async (params: ListNotesParams): Promise<PaginatedData<Note>> => {
    const response = await api.get<ApiResponse<PaginatedData<Note>>>("/notes", { params });
    return response.data.data!;
  },

  get: async (id: string): Promise<Note> => {
    const response = await api.get<ApiResponse<{ note: Note }>>(`/notes/${id}`);
    return response.data.data!.note;
  },

  create: async (dto: CreateNoteDto): Promise<Note> => {
    const response = await api.post<ApiResponse<{ note: Note }>>("/notes", dto);
    return response.data.data!.note;
  },

  update: async (id: string, dto: UpdateNoteDto): Promise<Note> => {
    const response = await api.put<ApiResponse<{ note: Note }>>(`/notes/${id}`, dto);
    return response.data.data!.note;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },
};
