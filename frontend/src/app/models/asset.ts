export interface AssetResponse {
  id: number;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  type: string;
  status: string;
  departmentName?: string;
  assignedUsername?: string;
}

export interface AssetCreateRequest {
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  type: string;
  status: string;
  departmentId?: number | null;
  assignedUserId?: number | null;
}

export interface AssetPage {
  content: AssetResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
