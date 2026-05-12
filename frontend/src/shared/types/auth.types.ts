export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roles: string[];
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile extends AuthUser {
  username: string;
  phone?: string;
  status: string;
  lastLoginAt?: string;
  permissions: string[];
  createdAt: string;
}
