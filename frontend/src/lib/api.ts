import type { Category, DashboardSummary, Session, Transaction, User } from './types';

const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unexpected error' }));
    throw new Error(body.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  register(input: { fullName: string; email: string; password: string }) {
    return request<Session>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  login(input: { email: string; password: string }) {
    return request<Session>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  me(token: string) {
    return request<{ user: User }>('/api/auth/me', {}, token);
  },
  logout(token: string) {
    return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }, token);
  },
  listCategories(token: string) {
    return request<Category[]>('/api/categories', {}, token);
  },
  createCategory(
    token: string,
    input: { name: string; type: 'income' | 'expense'; color: string; icon: string },
  ) {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    }, token);
  },
  updateCategory(
    token: string,
    id: number,
    input: { name: string; type: 'income' | 'expense'; color: string; icon: string },
  ) {
    return request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }, token);
  },
  deleteCategory(token: string, id: number) {
    return request<{ ok: boolean }>(`/api/categories/${id}`, { method: 'DELETE' }, token);
  },
  listTransactions(token: string, month: string) {
    return request<Transaction[]>(`/api/transactions?month=${month}`, {}, token);
  },
  createTransaction(
    token: string,
    input: { categoryId: number; type: 'income' | 'expense'; amount: number; note: string; transactionDate: string },
  ) {
    return request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    }, token);
  },
  updateTransaction(
    token: string,
    id: number,
    input: { categoryId: number; type: 'income' | 'expense'; amount: number; note: string; transactionDate: string },
  ) {
    return request<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }, token);
  },
  deleteTransaction(token: string, id: number) {
    return request<{ ok: boolean }>(`/api/transactions/${id}`, { method: 'DELETE' }, token);
  },
  dashboard(token: string, month: string) {
    return request<DashboardSummary>(`/api/dashboard/summary?month=${month}`, {}, token);
  },
};
