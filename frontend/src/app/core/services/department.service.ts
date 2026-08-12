import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:8080/api/departments';

  constructor(private http: HttpClient) {}

  getAllDepartments(): Observable<DepartmentResponse[]> {
    return this.http.get<DepartmentResponse[]>(this.apiUrl);
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
