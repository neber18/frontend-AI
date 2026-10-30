const numberFormat = new Intl.NumberFormat('es-CO');

export const formatNumber = (value) => numberFormat.format(Math.max(0, Math.round(value || 0)));

export const estimateTokens = (text) => {
  const trimmed = (text || '').trim();
  return trimmed ? Math.ceil(trimmed.length / 4) : 0;
};

export const AVERAGE_RESPONSE_TOKENS = 60;

export const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatLongDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (days > 0) return `${days} ${days === 1 ? 'día' : 'días'}, ${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h ${minutes} min ${seconds} s`;
  return `${minutes} min ${seconds} s`;
};

export const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatShortDay = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
};

export const PLAN_LABELS = {
  FREE: 'Free',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};
