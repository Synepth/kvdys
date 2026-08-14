import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse, UserCreateRequest, UserUpdateRequest, Page } from '../../models/user';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/v1/users';

  constructor(private http: HttpClient) {}

  getAllUsers(page = 0, size = 10, sortBy = 'id', search = '', departmentId: number | null = null): Observable<Page<UserResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy);
    if (search) params = params.set('search', search);
    if (departmentId !== null) params = params.set('departmentId', departmentId);
    return this.http.get<Page<UserResponse>>(this.apiUrl, { params });
  }

  createUser(request: UserCreateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, request);
  }

  updateUser(id: number, request: UserUpdateRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
