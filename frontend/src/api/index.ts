import { apiClient } from './client';
import type {
  AuthResponse,
  LoginCredentials,
  SignupData,
  User,
  Equipment,
  BodyMetrics,
  WorkoutPlan,
  WorkoutSession,
  AccountabilityStatus,
  PhotoUploadResponse,
  Penalty,
  ProgressStats,
} from '../types';

export { gamificationAPI } from './gamification';
export type { GamificationStats, XPGainResponse } from './gamification';

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/api/auth/login', credentials);
    return data;
  },

  signup: async (signupData: SignupData): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/api/auth/signup', signupData);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },
};

// Profile API
export const profileAPI = {
  getProfile: async (): Promise<{ user: User }> => {
    const { data } = await apiClient.get('/api/profile');
    return data;
  },

  updateProfile: async (profileData: Partial<User['profile']>): Promise<{ user: User }> => {
    const { data } = await apiClient.put('/api/profile', { profile: profileData });
    return data;
  },

  updatePreferences: async (
    preferences: Partial<User['preferences']>
  ): Promise<{ user: User }> => {
    const { data } = await apiClient.put('/api/profile', { preferences });
    return data;
  },
};

// Equipment API
export const equipmentAPI = {
  getAll: async (): Promise<{ equipment: Equipment[] }> => {
    const { data } = await apiClient.get('/api/equipment');
    return data;
  },

  getById: async (id: string): Promise<{ equipment: Equipment }> => {
    const { data } = await apiClient.get(`/api/equipment/${id}`);
    return data;
  },

  create: async (equipmentData: Partial<Equipment>): Promise<{ equipment: Equipment }> => {
    const { data } = await apiClient.post('/api/equipment', equipmentData);
    return data;
  },

  update: async (
    id: string,
    equipmentData: Partial<Equipment>
  ): Promise<{ equipment: Equipment }> => {
    const { data} = await apiClient.put(`/api/equipment/${id}`, equipmentData);
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/equipment/${id}`);
    return data;
  },
};

// Metrics API
export const metricsAPI = {
  getAll: async (): Promise<{
    metrics: BodyMetrics[];
    pagination: { total: number; limit: number; skip: number; has_more: boolean };
  }> => {
    const { data } = await apiClient.get('/api/metrics');
    return data;
  },

  getById: async (id: string): Promise<{ metrics: BodyMetrics }> => {
    const { data } = await apiClient.get(`/api/metrics/${id}`);
    return data;
  },

  create: async (metricsData: Partial<BodyMetrics>): Promise<{ metrics: BodyMetrics }> => {
    const { data } = await apiClient.post('/api/metrics', metricsData);
    return data;
  },

  update: async (
    id: string,
    metricsData: Partial<BodyMetrics>
  ): Promise<{ metrics: BodyMetrics }> => {
    const { data } = await apiClient.put(`/api/metrics/${id}`, metricsData);
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/metrics/${id}`);
    return data;
  },
};

// Workout API
export const workoutAPI = {
  generate: async (params?: Record<string, unknown>): Promise<{ workout: WorkoutPlan }> => {
    const { data } = await apiClient.post('/api/workouts/generate', params);
    return data;
  },

  getAll: async (): Promise<{ workouts: WorkoutPlan[] }> => {
    const { data } = await apiClient.get('/api/workouts');
    return data;
  },

  getById: async (id: string): Promise<{ workout: WorkoutPlan }> => {
    const { data } = await apiClient.get(`/api/workouts/${id}`);
    return data;
  },

  create: async (workoutData: Partial<WorkoutPlan>): Promise<{ workout: WorkoutPlan }> => {
    const { data } = await apiClient.post('/api/workouts', workoutData);
    return data;
  },

  update: async (
    id: string,
    workoutData: Partial<WorkoutPlan>
  ): Promise<{ workout: WorkoutPlan }> => {
    const { data } = await apiClient.put(`/api/workouts/${id}`, workoutData);
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/workouts/${id}`);
    return data;
  },

  setActive: async (id: string): Promise<{ message: string; plan: WorkoutPlan }> => {
    const { data } = await apiClient.patch(`/api/workouts/${id}/activate`);
    return data;
  },

  deactivate: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.patch(`/api/workouts/${id}/deactivate`);
    return data;
  },
};

// Session API
export const sessionAPI = {
  getAll: async (): Promise<{ sessions: WorkoutSession[] }> => {
    const { data } = await apiClient.get('/api/sessions');
    return data;
  },

  getById: async (id: string): Promise<{ session: WorkoutSession }> => {
    const { data } = await apiClient.get(`/api/sessions/${id}`);
    return data;
  },

  create: async (sessionData: Partial<WorkoutSession>): Promise<{ session: WorkoutSession }> => {
    const { data } = await apiClient.post('/api/sessions', sessionData);
    return data;
  },

  update: async (
    id: string,
    sessionData: Partial<WorkoutSession>
  ): Promise<{ session: WorkoutSession }> => {
    const { data } = await apiClient.patch(`/api/sessions/${id}`, sessionData);
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/sessions/${id}`);
    return data;
  },
};

// Accountability API
export const accountabilityAPI = {
  getStatus: async (): Promise<AccountabilityStatus> => {
    const { data } = await apiClient.get('/api/accountability/status');
    return data;
  },

  getPenalties: async (): Promise<{ penalties: Penalty[] }> => {
    const { data } = await apiClient.get('/api/accountability/penalties');
    return data;
  },

  completePenalty: async (
    id: string,
    evidenceFile?: File
  ): Promise<{ penalty: Penalty }> => {
    const formData = new FormData();
    if (evidenceFile) {
      formData.append('evidence', evidenceFile);
    }
    const { data } = await apiClient.put(`/api/accountability/penalties/${id}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

// AI Config API
export const aiConfigAPI = {
  get: async (): Promise<{ ai_config: { provider: string; model?: string; endpoint_url?: string; enabled: boolean; has_api_key: boolean } }> => {
    const { data } = await apiClient.get('/api/ai-config');
    return data;
  },

  update: async (config: { provider?: string; api_key?: string; model?: string; endpoint_url?: string; enabled?: boolean }): Promise<{ ai_config: { provider: string; model?: string; endpoint_url?: string; enabled: boolean; has_api_key: boolean }; message: string }> => {
    const { data } = await apiClient.patch('/api/ai-config', config);
    return data;
  },

  test: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post('/api/ai-config/test');
    return data;
  },

  deleteApiKey: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.delete('/api/ai-config/api-key');
    return data;
  },
};

// Photos API
export const photosAPI = {
  upload: async (
    photo: File,
    photoType: 'front' | 'side' | 'back',
    measurementDate?: string
  ): Promise<PhotoUploadResponse> => {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('photo_type', photoType);
    if (measurementDate) {
      formData.append('measurement_date', measurementDate);
    }

    const { data } = await apiClient.post('/api/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getAll: async (): Promise<{ photos: BodyMetrics[] }> => {
    const { data } = await apiClient.get('/api/photos');
    return data;
  },

  delete: async (userId: string, photoType: string, timestamp: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/api/photos/${userId}/${photoType}/${timestamp}`);
    return data;
  },
};

// Progress API
export const progressAPI = {
  getStats: async (): Promise<ProgressStats> => {
    const { data } = await apiClient.get('/api/progress');
    return data;
  },
};
