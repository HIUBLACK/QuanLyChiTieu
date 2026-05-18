import { useCallback, useEffect, useState, startTransition, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Plus,
  ReceiptText,
  ShieldCheck,
  Tag,
  WalletCards,
} from 'lucide-react';
import { api } from './lib/api';
import { formatCurrency, formatDate, monthLabel, toMonthInput } from './lib/format';
import type {
  AuthMode,
  Category,
  DashboardSummary,
  EntryType,
  Session,
  Transaction,
  ViewKey,
} from './lib/types';

const SESSION_KEY = 'expense-manager-session';

const iconOptions = ['wallet', 'briefcase', 'sparkles', 'utensils', 'car', 'receipt', 'shopping-bag', 'home'];
const colorOptions = ['#0f766e', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#dc2626', '#1d4ed8'];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error';
}

function emptySummary(month: string): DashboardSummary {
  return {
    month,
    totals: {
      income: 0,
      expense: 0,
      balance: 0,
    },
    byCategory: [],
    monthlyTrend: [],
    recentTransactions: [],
  };
}

function transactionDefaultCategoryId(categoryList: Category[], type: EntryType) {
  return categoryList.find((item) => item.type === type)?.id || 0;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  });
  const [view, setView] = useState<ViewKey>('dashboard');
  const [month, setMonth] = useState(toMonthInput());
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary(toMonthInput()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [categoryForm, setCategoryForm] = useState({
    id: 0,
    name: '',
    type: 'expense' as EntryType,
    color: colorOptions[0],
    icon: iconOptions[0],
  });
  const [transactionForm, setTransactionForm] = useState({
    id: 0,
    categoryId: 0,
    type: 'expense' as EntryType,
    amount: '',
    note: '',
    transactionDate: new Date().toISOString().slice(0, 10),
  });
  const sessionToken = session?.token;

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!sessionToken) {
      return;
    }

    void api
      .me(sessionToken)
      .then((response) => {
        setSession((current) => {
          if (!current || current.token !== sessionToken) {
            return current;
          }

          return {
            ...current,
            user: response.user,
          };
        });
      })
      .catch(() => {
        setSession(null);
      });
  }, [sessionToken]);

  const refreshAppData = useCallback(async (token: string, currentMonth: string) => {
    setLoading(true);
    setError('');

    try {
      const [dashboardData, categoryData, transactionData] = await Promise.all([
        api.dashboard(token, currentMonth),
        api.listCategories(token),
        api.listTransactions(token, currentMonth),
      ]);

      startTransition(() => {
        setSummary(dashboardData);
        setCategories(categoryData);
        setTransactions(transactionData);
      });

      setTransactionForm((current) => ({
        ...current,
        categoryId:
          current.categoryId ||
          transactionDefaultCategoryId(categoryData, current.type),
      }));
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);

      if (message.toLowerCase().includes('unauthorized')) {
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionToken) {
      return;
    }

    void refreshAppData(sessionToken, month);
  }, [month, refreshAppData, sessionToken]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    const formData = new FormData(event.currentTarget);

    try {
      const nextSession =
        authMode === 'login'
          ? await api.login({
              email: String(formData.get('email') || ''),
              password: String(formData.get('password') || ''),
            })
          : await api.register({
              fullName: String(formData.get('fullName') || ''),
              email: String(formData.get('email') || ''),
              password: String(formData.get('password') || ''),
            });

      setSession(nextSession);
      setNotice(authMode === 'login' ? 'Đăng nhập thành công.' : 'Tạo tài khoản thành công.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleLogout() {
    if (!session) {
      return;
    }

    try {
      await api.logout(session.token);
    } catch {
      // Logout is client-driven, ignore backend failure.
    }

    setSession(null);
    setSummary(emptySummary(month));
    setCategories([]);
    setTransactions([]);
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    setError('');
    setNotice('');

    try {
      if (categoryForm.id) {
        await api.updateCategory(session.token, categoryForm.id, categoryForm);
        setNotice('Đã cập nhật danh mục.');
      } else {
        await api.createCategory(session.token, categoryForm);
        setNotice('Đã thêm danh mục mới.');
      }

      setCategoryForm({
        id: 0,
        name: '',
        type: 'expense',
        color: colorOptions[0],
        icon: iconOptions[0],
      });
      await refreshAppData(session.token, month);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function removeCategory(id: number) {
    if (!session) return;

    try {
      await api.deleteCategory(session.token, id);
      setNotice('Đã xóa danh mục.');
      await refreshAppData(session.token, month);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    setError('');
    setNotice('');

    try {
      const payload = {
        categoryId: Number(transactionForm.categoryId),
        type: transactionForm.type,
        amount: Number(transactionForm.amount),
        note: transactionForm.note,
        transactionDate: transactionForm.transactionDate,
      };

      if (transactionForm.id) {
        await api.updateTransaction(session.token, transactionForm.id, payload);
        setNotice('Đã cập nhật giao dịch.');
      } else {
        await api.createTransaction(session.token, payload);
        setNotice('Đã thêm giao dịch mới.');
      }

      setTransactionForm({
        id: 0,
        categoryId: transactionDefaultCategoryId(categories, 'expense'),
        type: 'expense',
        amount: '',
        note: '',
        transactionDate: new Date().toISOString().slice(0, 10),
      });
      await refreshAppData(session.token, month);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function removeTransaction(id: number) {
    if (!session) return;

    try {
      await api.deleteTransaction(session.token, id);
      setNotice('Đã xóa giao dịch.');
      await refreshAppData(session.token, month);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  const filteredCategories = categories.filter((item) => item.type === transactionForm.type);
  const biggestCategoryTotal = Math.max(...summary.byCategory.map((item) => item.total), 1);

  if (!session) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.16),_transparent_28%),linear-gradient(180deg,#f4fbfa_0%,#f6f8fc_55%,#ffffff_100%)] px-4 py-10 text-slate-900">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              <ShieldCheck className="h-4 w-4" />
              Kiến trúc 3 lớp, Docker-ready, CI-ready
            </div>
            <h1 className="mt-6 max-w-xl font-['Space_Grotesk',sans-serif] text-5xl font-bold leading-tight tracking-[-0.04em]">
              ExpenseFlow giúp bạn kiểm soát thu chi theo cách trực quan hơn.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Quản lý danh mục, ghi nhận giao dịch, xem số dư hiện tại và biểu đồ thống kê theo tháng trên một giao diện hiện đại, gọn và dễ demo.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ['Tổng quan thời gian thực', 'Dashboard hiển thị tổng thu, tổng chi, số dư và xu hướng 6 tháng gần nhất.'],
                ['Quy trình rõ ràng', 'Đăng ký, đăng nhập, CRUD danh mục và giao dịch theo đúng yêu cầu bài.'],
                ['Sẵn sàng deploy', 'Tách frontend, backend, database và cấu hình môi trường để triển khai production.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Authentication</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </h2>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  onClick={() => setAuthMode('login')}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  onClick={() => setAuthMode('register')}
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Họ tên</span>
                  <input className="field-input" name="fullName" placeholder="Nguyen Van A" required />
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
                <input className="field-input" name="email" type="email" placeholder="ban@example.com" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Mật khẩu</span>
                <input className="field-input" name="password" type="password" placeholder="Tối thiểu 6 ký tự" required />
              </label>
              <button className="primary-button w-full" type="submit">
                {authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>

            {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {notice && <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
          </motion.section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(2,132,199,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(13,148,136,0.14),_transparent_22%),linear-gradient(180deg,#f5f7fb_0%,#ffffff_100%)] text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="w-full rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80">
          <div className="rounded-[24px] bg-[linear-gradient(135deg,#0f766e,_#0ea5a4)] p-6 text-white">
            <p className="text-sm uppercase tracking-[0.28em] text-teal-100">ExpenseFlow</p>
            <h1 className="mt-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-[-0.04em]">
              Xin chào, {session.user.full_name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-teal-50">
              Theo dõi tài chính cá nhân bằng dashboard trực quan và luồng CRUD rõ ràng cho buổi demo.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { key: 'transactions', label: 'Giao dịch', icon: ReceiptText },
              { key: 'categories', label: 'Danh mục', icon: Tag },
            ].map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${active ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => setView(item.key as ViewKey)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Số dư hiện tại</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{formatCurrency(summary.totals.balance)}</p>
            <p className="mt-2 text-sm text-slate-500">{monthLabel(summary.month)}</p>
          </div>

          <button className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900" onClick={handleLogout} type="button">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </aside>

        <main className="flex-1 space-y-6">
          <header className="flex flex-col gap-4 rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Finance Control Center</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                {view === 'dashboard' ? 'Bảng điều khiển' : view === 'transactions' ? 'Quản lý giao dịch' : 'Quản lý danh mục'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-500">Tháng</label>
              <input className="field-input w-[180px]" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </div>
          </header>

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          {notice && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

          {view === 'dashboard' && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Tổng thu nhập',
                    value: formatCurrency(summary.totals.income),
                    icon: ArrowUpCircle,
                    tone: 'text-emerald-600 bg-emerald-50',
                  },
                  {
                    label: 'Tổng chi tiêu',
                    value: formatCurrency(summary.totals.expense),
                    icon: ArrowDownCircle,
                    tone: 'text-rose-600 bg-rose-50',
                  },
                  {
                    label: 'Số dư hiện tại',
                    value: formatCurrency(summary.totals.balance),
                    icon: WalletCards,
                    tone: 'text-sky-600 bg-sky-50',
                  },
                  {
                    label: 'Danh mục hoạt động',
                    value: String(summary.byCategory.filter((item) => item.total > 0).length),
                    icon: CircleDollarSign,
                    tone: 'text-violet-600 bg-violet-50',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.article
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.07)]"
                    >
                      <div className={`inline-flex rounded-2xl p-3 ${item.tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-5 text-sm text-slate-500">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{item.value}</p>
                    </motion.article>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Biểu đồ thống kê</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">Xu hướng 6 tháng</h3>
                    </div>
                    <BarChart3 className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="mt-8 grid min-h-[280px] grid-cols-6 items-end gap-4">
                    {summary.monthlyTrend.map((item) => {
                      const peak = Math.max(...summary.monthlyTrend.map((entry) => Math.max(entry.income, entry.expense)), 1);
                      return (
                        <div key={item.month} className="flex flex-col items-center gap-3">
                          <div className="flex h-56 items-end gap-2">
                            <div className="w-5 rounded-full bg-emerald-400" style={{ height: `${(item.income / peak) * 100}%` }} />
                            <div className="w-5 rounded-full bg-rose-300" style={{ height: `${(item.expense / peak) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-500">{item.month.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Theo danh mục</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Phân bổ chi tiêu</h3>
                  <div className="mt-6 space-y-4">
                    {summary.byCategory.length === 0 && <p className="text-sm text-slate-500">Chưa có dữ liệu trong tháng này.</p>}
                    {summary.byCategory.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{item.name}</p>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.type}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{formatCurrency(item.total)}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white">
                          <div className="h-2 rounded-full" style={{ width: `${(item.total / biggestCategoryTotal) * 100}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Giao dịch gần đây</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Bản ghi mới nhất</h3>
                  </div>
                  {loading && <span className="text-sm text-slate-400">Đang tải...</span>}
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {summary.recentTransactions.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.category_color }} />
                        <p className="text-sm font-medium text-slate-900">{item.category_name}</p>
                      </div>
                      <p className={`mt-4 text-lg font-semibold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">{item.note || 'Khong co ghi chu'}</p>
                      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">{formatDate(item.transaction_date)}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {view === 'categories' && (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-900 p-3 text-white">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Category Form</p>
                    <h3 className="text-xl font-semibold text-slate-900">{categoryForm.id ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
                  </div>
                </div>
                <form className="mt-6 space-y-4" onSubmit={submitCategory}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">Tên danh mục</span>
                    <input className="field-input" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">Loại</span>
                    <select className="field-input" value={categoryForm.type} onChange={(event) => setCategoryForm((current) => ({ ...current, type: event.target.value as EntryType }))}>
                      <option value="expense">Chi tiêu</option>
                      <option value="income">Thu nhập</option>
                    </select>
                  </label>
                  <div>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Màu</span>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          className={`h-10 w-10 rounded-full border-4 ${categoryForm.color === color ? 'border-slate-900' : 'border-white'}`}
                          onClick={() => setCategoryForm((current) => ({ ...current, color }))}
                          style={{ backgroundColor: color }}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">Icon key</span>
                    <select className="field-input" value={categoryForm.icon} onChange={(event) => setCategoryForm((current) => ({ ...current, icon: event.target.value }))}>
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-3">
                    <button className="primary-button flex-1" type="submit">
                      {categoryForm.id ? 'Lưu thay đổi' : 'Tạo danh mục'}
                    </button>
                    {categoryForm.id > 0 && (
                      <button
                        className="secondary-button"
                        onClick={() => setCategoryForm({ id: 0, name: '', type: 'expense', color: colorOptions[0], icon: iconOptions[0] })}
                        type="button"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </article>

              <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Category List</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Danh sách danh mục</h3>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {categories.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{item.type}</p>
                            <p className="mt-3 text-sm text-slate-500">Icon: {item.icon}</p>
                          </div>
                        </div>
                        <Tag className="h-5 w-5 text-slate-300" />
                      </div>
                      <div className="mt-5 flex gap-3">
                        <button className="secondary-button" onClick={() => setCategoryForm({ id: item.id, name: item.name, type: item.type, color: item.color, icon: item.icon })} type="button">
                          Sửa
                        </button>
                        <button className="danger-button" onClick={() => void removeCategory(item.id)} type="button">
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {view === 'transactions' && (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-900 p-3 text-white">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Transaction Form</p>
                    <h3 className="text-xl font-semibold text-slate-900">{transactionForm.id ? 'Sửa giao dịch' : 'Thêm khoản thu/chi'}</h3>
                  </div>
                </div>
                <form className="mt-6 space-y-4" onSubmit={submitTransaction}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">Loại giao dịch</span>
                    <select
                      className="field-input"
                      value={transactionForm.type}
                      onChange={(event) => {
                        const nextType = event.target.value as EntryType;
                        setTransactionForm((current) => ({
                          ...current,
                          type: nextType,
                          categoryId: transactionDefaultCategoryId(categories, nextType),
                        }));
                      }}
                    >
                      <option value="expense">Chi tiêu</option>
                      <option value="income">Thu nhập</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">Danh mục</span>
                    <select
                      className="field-input"
                      value={transactionForm.categoryId}
                      onChange={(event) => setTransactionForm((current) => ({ ...current, categoryId: Number(event.target.value) }))}
                      required
                    >
                      <option value={0}>Chọn danh mục</option>
                      {filteredCategories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">Số tiền</span>
                    <input className="field-input" min="1000" step="1000" type="number" value={transactionForm.amount} onChange={(event) => setTransactionForm((current) => ({ ...current, amount: event.target.value }))} required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">Ngày giao dịch</span>
                    <input className="field-input" type="date" value={transactionForm.transactionDate} onChange={(event) => setTransactionForm((current) => ({ ...current, transactionDate: event.target.value }))} required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">Ghi chú</span>
                    <textarea className="field-input min-h-28 resize-none" value={transactionForm.note} onChange={(event) => setTransactionForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ví dụ: Lương tháng 5, cafe cuối tuần..." />
                  </label>
                  <div className="flex gap-3">
                    <button className="primary-button flex-1" type="submit">
                      {transactionForm.id ? 'Lưu giao dịch' : 'Thêm giao dịch'}
                    </button>
                    {transactionForm.id > 0 && (
                      <button
                        className="secondary-button"
                        onClick={() => setTransactionForm({ id: 0, categoryId: transactionDefaultCategoryId(categories, 'expense'), type: 'expense', amount: '', note: '', transactionDate: new Date().toISOString().slice(0, 10) })}
                        type="button"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </article>

              <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Transaction Table</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Danh sách giao dịch</h3>
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                  <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <span>Danh mục</span>
                    <span>Ngày</span>
                    <span>Số tiền</span>
                    <span>Thao tác</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {transactions.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center px-4 py-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{item.category_name}</p>
                          <p className="mt-1 text-slate-500">{item.note || 'Khong co ghi chu'}</p>
                        </div>
                        <span className="text-slate-500">{formatDate(item.transaction_date)}</span>
                        <span className={item.type === 'income' ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                          {item.type === 'income' ? '+' : '-'}
                          {formatCurrency(item.amount)}
                        </span>
                        <div className="flex gap-2">
                          <button
                            className="secondary-button px-3 py-2 text-xs"
                            onClick={() =>
                              setTransactionForm({
                                id: item.id,
                                categoryId: item.category_id,
                                type: item.type,
                                amount: String(item.amount),
                                note: item.note,
                                transactionDate: item.transaction_date.slice(0, 10),
                              })
                            }
                            type="button"
                          >
                            Sửa
                          </button>
                          <button className="danger-button px-3 py-2 text-xs" onClick={() => void removeTransaction(item.id)} type="button">
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">Chưa có giao dịch trong tháng đã chọn.</div>
                    )}
                  </div>
                </div>
              </article>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
