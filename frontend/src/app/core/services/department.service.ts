import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../../models/user';

export interface DepartmentResponse {
  id: number;
  name: string;
  description?: string;
  userCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = 'http://localhost:8080/api/v1/departments';

  constructor(private http: HttpClient) {}

  getAllDepartments(page = 0, size = 10, sortBy = 'id', search = ''): Observable<Page<DepartmentResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy);
    if (search) params = params.set('search', search);
    return this.http.get<Page<DepartmentResponse>>(this.apiUrl, { params });
  }

  getAllDepartmentsList(): Observable<DepartmentResponse[]> {
    return this.http.get<DepartmentResponse[]>(`${this.apiUrl}/all`);
  }

  createDepartment(name: string, description: string): Observable<DepartmentResponse> {
    return this.http.post<DepartmentResponse>(this.apiUrl, { name, description });
  }

  updateDepartment(id: number, name: string, description: string): Observable<DepartmentResponse> {
    return this.http.put<DepartmentResponse>(`${this.apiUrl}/${id}`, { name, description });
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
