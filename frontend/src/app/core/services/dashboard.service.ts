import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../../models/dashboard';
import { AssetResponse } from '../../models/asset';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  getRecentAssets(): Observable<AssetResponse[]> {
    return this.http.get<AssetResponse[]>(`${this.apiUrl}/assets/recent`);
  }
}
