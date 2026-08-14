export interface RoleResponse {
  id: number;
  name: string;
  description?: string;
  userCount: number;
}
export interface RoleCreateRequest {
  name: string;
  description?: string;
}
