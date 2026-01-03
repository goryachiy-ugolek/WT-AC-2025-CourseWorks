import api from "./client";
import type { ApiResponse, Expense, PaginatedData } from "../types";

export interface CreateExpenseDto {
  tripId: string;
  amount: number;
  category?: string;
  description?: string;
  date: string; // ISO datetime
}

export interface UpdateExpenseDto extends Partial<Omit<CreateExpenseDto, "tripId">> {}

export interface ListExpensesParams {
  tripId: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export const expensesApi = {
  list: async (params: ListExpensesParams): Promise<PaginatedData<Expense>> => {
    const response = await api.get<ApiResponse<PaginatedData<Expense>>>("/expenses", { params });
    return response.data.data!;
  },

  get: async (id: string): Promise<Expense> => {
    const response = await api.get<ApiResponse<{ expense: Expense }>>(`/expenses/${id}`);
    return response.data.data!.expense;
  },

  create: async (dto: CreateExpenseDto): Promise<Expense> => {
    const response = await api.post<ApiResponse<{ expense: Expense }>>("/expenses", dto);
    return response.data.data!.expense;
  },

  update: async (id: string, dto: UpdateExpenseDto): Promise<Expense> => {
    const response = await api.put<ApiResponse<{ expense: Expense }>>(`/expenses/${id}`, dto);
    return response.data.data!.expense;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};
