import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { NotificationResponse, UnreadCountResponse } from '../../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/v1/notifications';

  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getNotifications(page = 0, size = 20): Observable<NotificationResponse[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<NotificationResponse[]>(this.apiUrl, { params });
  }

  fetchUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      tap(res => this.unreadCount.set(res.unreadCount))
    );
  }

  markAsRead(id: number): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCount.set(0);
      })
    );
  }
}
