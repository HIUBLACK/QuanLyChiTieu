export type AuthMode = 'login' | 'register';
export type ViewKey = 'dashboard' | 'transactions' | 'categories';
export type EntryType = 'income' | 'expense';

export interface User {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Session {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  type: EntryType;
  color: string;
  icon: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  type: EntryType;
  amount: number;
  note: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  month: string;
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  byCategory: Array<{
    id: number;
    name: string;
    type: EntryType;
    color: string;
    total: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  recentTransactions: Array<{
    id: number;
    type: EntryType;
    amount: number;
    note: string;
    transaction_date: string;
    category_name: string;
    category_color: string;
  }>;
}
