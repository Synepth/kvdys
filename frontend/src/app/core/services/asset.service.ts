import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetCreateRequest, AssetResponse } from '../../models/asset';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = 'http://localhost:8080/api/v1/assets';

  constructor(private http: HttpClient) {}

  getAllAssets(): Observable<AssetResponse[]> {
    return this.http.get<AssetResponse[]>(this.apiUrl);
  }

  createAsset(request: AssetCreateRequest): Observable<AssetResponse> {
    return this.http.post<AssetResponse>(this.apiUrl, request);
  }

  updateAsset(id: number, request: AssetCreateRequest): Observable<AssetResponse> {
    return this.http.put<AssetResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteAsset(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
