export interface User {
  id: number;
  username: string;
  role: string;
  can_transfer_budget: boolean;
  user_level: string;
  user_level_name: string,
}

export interface AuthTokens {
  token: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: User;
  user_level: number;
  message: string;
  token: string;
  user_level_name: string;
  refresh: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  password: string;
}

export interface LogoutRequest {
  refresh: string;
  access: string;
}
