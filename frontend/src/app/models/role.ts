export interface RoleResponse {
  id: number;
  name: string;
  description?: string;
  userCount: number;
  permissions?: string[];
}
export interface RoleCreateRequest {
  name: string;
  description?: string;
  permissions?: string[];
}
