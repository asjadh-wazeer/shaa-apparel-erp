import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '../../../shared/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
}

const loadStoredAuth = (): Partial<AuthState> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userJson = localStorage.getItem('authUser');
    const permissionsJson = localStorage.getItem('authPermissions');

    if (accessToken && userJson) {
      return {
        accessToken,
        refreshToken,
        user: JSON.parse(userJson) as AuthUser,
        permissions: permissionsJson ? (JSON.parse(permissionsJson) as string[]) : [],
        isAuthenticated: true,
      };
    }
  } catch {
    // Storage read failed — start fresh
  }
  return {};
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  permissions: [],
  isAuthenticated: false,
  ...loadStoredAuth(),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        user?: AuthUser;
        accessToken: string;
        refreshToken: string;
        permissions?: string[];
      }>,
    ) {
      const { user, accessToken, refreshToken, permissions } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      if (user) {
        state.user = user;
        localStorage.setItem('authUser', JSON.stringify(user));
      }
      if (permissions) {
        state.permissions = permissions;
        localStorage.setItem('authPermissions', JSON.stringify(permissions));
      }
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.permissions = [];
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authPermissions');
    },
    updateProfile(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('authUser', JSON.stringify(state.user));
      }
    },
  },
});

export const { setCredentials, logout, updateProfile } = authSlice.actions;
