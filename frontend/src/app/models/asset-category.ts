export interface AssetCategoryResponse {
  id: number;
  name: string;
  code: string;
  description?: string;
  assetCount: number;
}

export interface AssetCategoryRequest {
  name: string;
  code?: string;
  description?: string;
}