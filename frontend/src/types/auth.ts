export type Role = 'CITIZEN' | 'FIELD_OFFICER' | 'DISTRICT_ADMIN' | 'STATE_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  districtId?: string | null;
  stateId?: string | null;
  failedLoginAttempts?: number;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
