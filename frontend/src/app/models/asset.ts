export interface AssetResponse {
  id: number;
  name: string;
  serialNumber: string;
  type: string;
  status: string;
  departmentName?: string;
  assignedUsername?: string;
}

export interface AssetCreateRequest {
  name: string;
  serialNumber: string;
  type: string;
  status: string;
  departmentId?: number | null;
  assignedUserId?: number | null;
}
