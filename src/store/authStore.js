import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('cdms_user') || 'null'),
  accessToken: localStorage.getItem('cdms_access_token') || null,
  refreshToken: localStorage.getItem('cdms_refresh_token') || null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('cdms_user', JSON.stringify(user));
    localStorage.setItem('cdms_access_token', accessToken);
    localStorage.setItem('cdms_refresh_token', refreshToken);
    set({ user, accessToken, refreshToken });
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('cdms_access_token', accessToken);
    if (refreshToken) localStorage.setItem('cdms_refresh_token', refreshToken);
    set({ accessToken, ...(refreshToken ? { refreshToken } : {}) });
  },

  logout: () => {
    localStorage.removeItem('cdms_user');
    localStorage.removeItem('cdms_access_token');
    localStorage.removeItem('cdms_refresh_token');
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
