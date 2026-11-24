import { http, HttpResponse } from 'msw';

const MOCK_USER = {
  sub: 'mock-user-sub-123',
  email: 'mock@example.com',
};

// REST handlers for auth endpoints — intercept browser-side calls to /api/auth/...
// so the app sees an always-authenticated user without a real OIDC provider.
export const authHandlers = [
  http.get('/api/auth/onboarding/me', () =>
    HttpResponse.json({ isAuthenticated: true, user: MOCK_USER, tokenExpiresAt: null }),
  ),

  http.post('/api/auth/onboarding/refresh', () => HttpResponse.json({ success: true })),

  // Match with or without query params (?namespace=…&mcp=…&idp=…)
  http.get('/api/auth/mcp/me', () => HttpResponse.json({ isAuthenticated: true, tokenExpiresAt: null })),

  http.post('/api/auth/mcp/refresh', () => HttpResponse.json({ success: true })),

  http.post('/api/auth/logout', () => HttpResponse.json({ message: 'Logged out' })),
];
