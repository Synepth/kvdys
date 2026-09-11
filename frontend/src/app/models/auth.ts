export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  userId: number;
  avatarUrl?: string | null;
  roles?: string[];
  permissions?: string[];
}
