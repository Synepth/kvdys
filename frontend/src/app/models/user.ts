export interface UserResponse {
  id: number;
  username: string;
  email: string;
  departmentName?: string;
  roles?: string[];
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
