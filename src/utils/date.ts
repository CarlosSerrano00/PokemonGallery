export function formatTime(timestamp?: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatDateTime(isoDate: string): string {
  if (!isoDate) return 'Fecha desconocida';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${formatTime(date.getTime())}`;
}
