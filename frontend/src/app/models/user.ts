export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  departmentName?: string;
  roles?: string[];
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password?: string;
  departmentId: number;
  roleIds?: number[];
}

export interface UserUpdateRequest {
  username: string;
  email: string;
  departmentId: number;
  roleIds?: number[];
}

export interface ChangePasswordRequest {
  username?: string;
  currentPassword: string;
  newPassword: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
