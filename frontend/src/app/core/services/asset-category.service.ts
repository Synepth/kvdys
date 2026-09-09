import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetCategoryRequest, AssetCategoryResponse } from '../../models/asset-category';

@Injectable({
  providedIn: 'root'
})
export class AssetCategoryService {
  private apiUrl = 'http://localhost:8080/api/v1/asset-categories';

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<AssetCategoryResponse[]> {
    return this.http.get<AssetCategoryResponse[]>(this.apiUrl);
  }

  getCategoryById(id: number): Observable<AssetCategoryResponse> {
    return this.http.get<AssetCategoryResponse>(`${this.apiUrl}/${id}`);
  }

  createCategory(request: AssetCategoryRequest): Observable<AssetCategoryResponse> {
    return this.http.post<AssetCategoryResponse>(this.apiUrl, request);
  }

  updateCategory(id: number, request: AssetCategoryRequest): Observable<AssetCategoryResponse> {
    return this.http.put<AssetCategoryResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}