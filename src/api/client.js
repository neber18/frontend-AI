const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function request(path, userId, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor.');
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const header = Number(response.headers.get('Retry-After'));
    const retryAfter = Number.isFinite(header) && header > 0 ? header : body?.retryAfterSeconds ?? null;
    throw new ApiError(response.status, body?.message || response.statusText, retryAfter);
  }
  return body;
}

export const api = {
  generate: (userId, prompt) =>
    request('/api/ai/generate', userId, { method: 'POST', body: JSON.stringify({ userId, prompt }) }),
  status: (userId) => request('/api/quota/status', userId),
  history: (userId) => request('/api/quota/history', userId),
  plans: (userId) => request('/api/quota/plans', userId),
  upgrade: (userId, targetPlan, cardHolder, cardLastFour) =>
    request('/api/quota/upgrade', userId, {
      method: 'POST',
      body: JSON.stringify({ targetPlan, cardHolder, cardLastFour }),
    }),
};
