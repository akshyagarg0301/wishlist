const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

export function resolveApiUrl(path) {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text || response.statusText;
    try {
      const parsed = text ? JSON.parse(text) : null;
      if (parsed && parsed.error) {
        message = parsed.error;
      }
    } catch (err) {}
    throw new Error(message);
  }
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Auth
  getMe: () => request('/api/auth/me'),
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  createUser: (name, email, password) =>
    request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }),

  // Events
  getEvents: () => request('/api/events'),
  getEvent: (eventId) => request(`/api/events/${eventId}`),
  getEventPage: (eventId) => request(`/api/events/${eventId}/page`),
  createEvent: async (data) =>
    request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteEvent: (eventId) =>
    request(`/api/events/${eventId}`, {
      method: 'DELETE',
    }),

  // Gifts
  getGifts: () => request('/api/gifts'),
  getEventGifts: (eventId) => request(`/api/events/${eventId}/gifts`),
  createGift: (data) =>
    request('/api/gifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteGift: (giftId) =>
    request(`/api/gifts/${giftId}`, {
      method: 'DELETE',
    }),
  purchaseOwnerGift: (giftId) =>
    request(`/api/gifts/${giftId}/purchase`, {
      method: 'POST',
    }),
  reserveGift: (giftId, guestName, guestEmail) =>
    request(`/api/gifts/${giftId}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestName, guestEmail }),
    }),
  purchaseGift: (giftId, guestName, guestEmail) =>
    request(`/api/gifts/${giftId}/purchase-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestName, guestEmail }),
    }),

  // Guests
  getGuestMe: () => request('/api/guests/me'),
  createGuestFromAuth: () => request('/api/guests/from-auth', { method: 'POST' }),
  verifyGoogleGuest: (credential) =>
    request('/api/guests/google/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    }),

  // Event actions
  revealEvent: (eventId) =>
    request(`/api/events/${eventId}/reveal`, { method: 'POST' }),
  hideEvent: (eventId) =>
    request(`/api/events/${eventId}/hide`, { method: 'POST' }),

  // Imports
  previewImport: (url) =>
    request('/api/imports/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }),
};
