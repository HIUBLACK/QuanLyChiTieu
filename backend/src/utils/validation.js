export function assertEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseMonth(month) {
  if (!month) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Month must be in YYYY-MM format');
  }

  return month;
}

export function ensureTransactionType(type) {
  if (!['income', 'expense'].includes(type)) {
    throw new Error('Type must be income or expense');
  }
}
