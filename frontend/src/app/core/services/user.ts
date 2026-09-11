export interface UserResponse {
  id: number;
  username: string;
  email: string;
  departmentName?: string;
  roles?: string[];
}
