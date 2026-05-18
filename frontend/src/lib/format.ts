export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-');
  return `Tháng ${monthNumber}/${year}`;
}

export function toMonthInput(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
