/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Singleton promise for token refresh - prevents race conditions
// when multiple 401s occur simultaneously
let refreshPromise: Promise<string> | null = null;

/**
 * Refreshes the access token using the refresh token.
 * Uses singleton promise pattern to prevent multiple concurrent refresh calls.
 */
const refreshAccessToken = async (): Promise<string> => {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Start a new refresh
  refreshPromise = (async () => {
    try {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });

      // Backend now returns both new access token and rotated refresh token
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      // Update store with new tokens
      useAuthStore.getState().setAuth(
        useAuthStore.getState().user!,
        newAccessToken,
        newRefreshToken || refreshToken // Use new refresh token if returned, else keep old
      );

      return newAccessToken;
    } finally {
      // Clear the promise so future 401s can trigger new refresh
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors (server offline, no internet)
    if (!error.response) {
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        toast.error('Cannot connect to server. Please check your connection or try again later.');
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Skip token refresh for auth endpoints (login, signup, refresh)
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Use singleton refresh - all concurrent 401s share same promise
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Extract error message from backend response
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    return Promise.reject(error);
  }
);
