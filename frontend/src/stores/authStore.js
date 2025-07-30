/**
 * Authentication Store for ICSHD GENIUSES
 * Manages user authentication state and operations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login(credentials);
          const { user, tokens } = response.data;

          set({
            user,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store tokens in localStorage for API requests
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          toast.success(`مرحباً بك ${user.fullName}`);
          return { success: true, user };

        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'خطأ في تسجيل الدخول';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.register(userData);
          const { user, tokens } = response.data;

          set({
            user,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          toast.success('تم إنشاء الحساب بنجاح');
          return { success: true, user };

        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'خطأ في إنشاء الحساب';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state regardless of API call success
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });

          // Clear tokens from localStorage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');

          toast.success('تم تسجيل الخروج بنجاح');
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authAPI.getProfile();
          const user = response.data.user;

          set({
            user,
            token,
            refreshToken: localStorage.getItem('refreshToken'),
            isAuthenticated: true,
            isLoading: false,
          });

        } catch (error) {
          // Token is invalid, clear everything
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });

          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      },

      refreshTokens: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authAPI.refreshToken({ refreshToken });
          const { tokens } = response.data;

          set({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });

          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          return tokens.accessToken;

        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.updateProfile(profileData);
          const updatedUser = response.data.user;

          set({
            user: updatedUser,
            isLoading: false,
          });

          toast.success('تم تحديث البيانات بنجاح');
          return { success: true, user: updatedUser };

        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'خطأ في تحديث البيانات';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true });
        try {
          await authAPI.changePassword(passwordData);
          set({ isLoading: false });

          toast.success('تم تغيير كلمة المرور بنجاح');
          return { success: true };

        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'خطأ في تغيير كلمة المرور';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Getters
      isStudent: () => get().user?.role === 'student',
      isTrainer: () => get().user?.role === 'trainer',
      isAdmin: () => get().user?.role === 'admin',
      
      hasRole: (role) => get().user?.role === role,
      hasAnyRole: (roles) => roles.includes(get().user?.role),

      getUserInfo: () => {
        const user = get().user;
        if (!user) return null;

        return {
          id: user._id || user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          studentCode: user.studentCode,
          avatar: user.profile?.avatar,
          currentLevel: user.currentLevel,
          subscription: user.subscription,
        };
      },
    }),
    {
      name: 'icshd-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
