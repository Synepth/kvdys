import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TicketCreateRequest,
  TicketUpdateRequest,
  TicketResponse,
  TicketPage,
  CommentResponse,
  CommentCreateRequest,
  AttachmentResponse
} from '../../models/ticket';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'http://localhost:8080/api/v1/tickets';

  constructor(private http: HttpClient) {}

  getAllTickets(
    page = 0,
    size = 10,
    search = '',
    status = '',
    category = '',
    priority = ''
  ): Observable<TicketPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search)   params = params.set('search', search);
    if (status)   params = params.set('status', status);
    if (category) params = params.set('category', category);
    if (priority) params = params.set('priority', priority);

    return this.http.get<TicketPage>(this.apiUrl, { params });
  }

  getTicketById(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.apiUrl}/${id}`);
  }

  createTicket(request: TicketCreateRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(this.apiUrl, request);
  }

  updateTicket(id: number, request: TicketUpdateRequest): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Comments
  getComments(ticketId: number): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${this.apiUrl}/${ticketId}/comments`);
  }

  addComment(ticketId: number, request: CommentCreateRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${this.apiUrl}/${ticketId}/comments`, request);
  }

  deleteComment(ticketId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${ticketId}/comments/${commentId}`);
  }

  // Attachments
  getAttachments(ticketId: number): Observable<AttachmentResponse[]> {
    return this.http.get<AttachmentResponse[]>(`${this.apiUrl}/${ticketId}/attachments`);
  }

  uploadAttachment(ticketId: number, file: File): Observable<AttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AttachmentResponse>(`${this.apiUrl}/${ticketId}/attachments`, formData);
  }

  deleteAttachment(ticketId: number, attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${ticketId}/attachments/${attachmentId}`);
  }

  downloadAttachment(ticketId: number, attachmentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ticketId}/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    });
  }
}
