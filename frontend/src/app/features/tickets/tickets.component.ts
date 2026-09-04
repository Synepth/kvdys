import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TicketService } from '../../core/services/ticket.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  TicketResponse,
  TicketCreateRequest,
  TicketUpdateRequest,
  CommentResponse,
  AttachmentResponse
} from '../../models/ticket';
import { UserResponse } from '../../models/user';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './tickets.component.html'
})
export class TicketsComponent implements OnInit, OnDestroy {

  // Table & pagination state
  tickets: TicketResponse[] = [];
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  isInitialLoading = true;
  isLoading = false;

  // Filter state
  searchTerm = '';
  selectedStatus = '';
  selectedPriority = '';
  selectedCategory = '';

  // RxJS Debounce & Cleanup
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Dropdown data
  users: UserResponse[] = [];

  // Modals & form models
  selectedTicket: TicketResponse | null = null;
  activeDetailTab: 'details' | 'comments' | 'attachments' = 'details';

  newTicket: TicketCreateRequest = this.getEmptyCreateRequest();
  editTicketId: number | null = null;
  editTicketModel: TicketUpdateRequest = this.getEmptyUpdateRequest();

  // Comments state
  comments: CommentResponse[] = [];
  newCommentText = '';
  isCommentsLoading = false;
  isSubmittingComment = false;

  // Attachments state
  attachments: AttachmentResponse[] = [];
  selectedFileToUpload: File | null = null;
  isAttachmentsLoading = false;
  isUploadingAttachment = false;

  constructor(
    private ticketService: TicketService,
    private userService: UserService,
    public authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Debounced real-time search
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((term) => {
      this.searchTerm = term;
      this.loadTickets(0);
    });

    // 2. Initial data load
    this.loadTickets();
    this.loadUsers();

    // 3. Deep-linking support (/tickets?id=123)
    this.route.queryParamMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const ticketId = Number(idParam);
        if (!isNaN(ticketId) && ticketId > 0 && (!this.selectedTicket || this.selectedTicket.id !== ticketId)) {
          this.openTicketById(ticketId);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  loadTickets(page = this.currentPage): void {
    this.isLoading = true;
    this.ticketService.getAllTickets(
      page,
      this.pageSize,
      this.searchTerm,
      this.selectedStatus,
      this.selectedCategory,
      this.selectedPriority
    ).subscribe({
      next: (data) => {
        this.tickets = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.currentPage = data.number;
        this.isLoading = false;
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.isInitialLoading = false;
        this.toastService.error('Failed to load support requests.');
        this.cdr.detectChanges();
      }
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers(0, 999).subscribe({
      next: (data) => {
        this.users = data.content;
        this.cdr.detectChanges();
      },
      error: () => console.warn('Could not load user list for ticket assignment.')
    });
  }

  onFilterChange(): void {
    this.loadTickets(0);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.selectedCategory = '';
    this.loadTickets(0);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.loadTickets(page);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // ==================== QUICK ACTIONS ====================

  /**
   * In-line quick status change directly from table badge
   */
  updateTicketStatus(ticket: TicketResponse, newStatus: 'Open' | 'In Review' | 'Resolved' | 'Cancelled'): void {
    if (ticket.status === newStatus) return;

    const req: TicketUpdateRequest = {
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: newStatus,
      assignedUserId: ticket.assignedUserId ?? null
    };

    this.ticketService.updateTicket(ticket.id, req).subscribe({
      next: (updated) => {
        ticket.status = updated.status;
        ticket.updatedAt = updated.updatedAt;
        if (this.selectedTicket && this.selectedTicket.id === updated.id) {
          this.selectedTicket.status = updated.status;
          this.selectedTicket.updatedAt = updated.updatedAt;
        }
        this.toastService.success(`Status updated to "${newStatus}".`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to update status.');
      }
    });
  }

  /**
   * 1-Click "Assign to Me"
   */
  assignToMe(ticket: TicketResponse): void {
    const currentUserId = this.authService.userId();
    if (!currentUserId) {
      this.toastService.warning('User profile ID not found.');
      return;
    }

    const req: TicketUpdateRequest = {
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assignedUserId: currentUserId
    };

    this.ticketService.updateTicket(ticket.id, req).subscribe({
      next: (updated) => {
        ticket.assignedUserId = updated.assignedUserId;
        ticket.assignedUsername = updated.assignedUsername;
        ticket.assignedName = updated.assignedName;
        ticket.updatedAt = updated.updatedAt;
        if (this.selectedTicket && this.selectedTicket.id === updated.id) {
          this.selectedTicket = { ...this.selectedTicket, ...updated };
        }
        this.toastService.success(`Support request #${ticket.id} assigned to you.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to assign ticket.');
      }
    });
  }

  // ==================== TICKET CRUD ====================

  openCreateModal(): void {
    this.newTicket = this.getEmptyCreateRequest();
  }

  createTicket(): void {
    if (!this.newTicket.title.trim() || !this.newTicket.description.trim()) {
      this.toastService.warning('Title and description are required.');
      return;
    }

    this.ticketService.createTicket(this.newTicket).subscribe({
      next: () => {
        this.toastService.success('Support request created successfully.');
        this.newTicket = this.getEmptyCreateRequest();
        this.loadTickets(0);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to create support request.');
      }
    });
  }

  openEditModal(ticket: TicketResponse): void {
    this.editTicketId = ticket.id;
    this.editTicketModel = {
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assignedUserId: ticket.assignedUserId ?? null
    };
  }

  updateTicket(): void {
    if (!this.editTicketId) return;

    this.ticketService.updateTicket(this.editTicketId, this.editTicketModel).subscribe({
      next: (updated) => {
        this.toastService.success('Support request updated successfully.');
        this.loadTickets(this.currentPage);
        if (this.selectedTicket && this.selectedTicket.id === updated.id) {
          this.selectedTicket = { ...updated };
        }
        this.editTicketId = null;
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to update support request.');
      }
    });
  }

  deleteTicket(ticket: TicketResponse): void {
    if (!confirm(`Are you sure you want to delete support request #${ticket.id}: "${ticket.title}"?`)) {
      return;
    }

    this.ticketService.deleteTicket(ticket.id).subscribe({
      next: () => {
        this.toastService.success('Support request deleted successfully.');
        this.loadTickets(this.currentPage);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to delete support request.');
      }
    });
  }

  // ==================== DETAIL MODAL & DEEP-LINKING ====================

  openDetailModal(ticket: TicketResponse): void {
    this.selectedTicket = { ...ticket };
    this.activeDetailTab = 'details';
    this.newCommentText = '';
    this.selectedFileToUpload = null;

    // Update URL query param ?id=xxx
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: ticket.id },
      queryParamsHandling: 'merge'
    });

    // Fetch latest fresh data for the ticket
    this.ticketService.getTicketById(ticket.id).subscribe({
      next: (fresh) => {
        this.selectedTicket = fresh;
        this.cdr.detectChanges();
      }
    });

    this.loadComments(ticket.id);
    this.loadAttachments(ticket.id);
  }

  openTicketById(ticketId: number): void {
    this.ticketService.getTicketById(ticketId).subscribe({
      next: (ticket) => {
        this.openDetailModal(ticket);
        this.triggerBootstrapModalShow('detailTicketModal');
      },
      error: () => {
        this.toastService.error(`Could not find support request #${ticketId}.`);
        this.closeDetailModal();
      }
    });
  }

  closeDetailModal(): void {
    this.selectedTicket = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge'
    });
  }

  private triggerBootstrapModalShow(modalId: string): void {
    const modalEl = document.getElementById(modalId);
    const bs = (window as any).bootstrap;
    if (modalEl && bs && bs.Modal) {
      const modal = bs.Modal.getInstance(modalEl) || new bs.Modal(modalEl);
      modal.show();
    }
  }

  setActiveTab(tab: 'details' | 'comments' | 'attachments'): void {
    this.activeDetailTab = tab;
  }

  // Comments

  loadComments(ticketId: number): void {
    this.isCommentsLoading = true;
    this.ticketService.getComments(ticketId).subscribe({
      next: (data) => {
        this.comments = data;
        this.isCommentsLoading = false;
        if (this.selectedTicket) {
          this.selectedTicket.commentCount = data.length;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isCommentsLoading = false;
        this.toastService.error('Failed to load comments.');
        this.cdr.detectChanges();
      }
    });
  }

  addComment(): void {
    if (!this.selectedTicket || !this.newCommentText.trim()) return;

    this.isSubmittingComment = true;
    this.ticketService.addComment(this.selectedTicket.id, { content: this.newCommentText.trim() }).subscribe({
      next: () => {
        this.newCommentText = '';
        this.isSubmittingComment = false;
        this.toastService.success('Comment added.');
        this.loadComments(this.selectedTicket!.id);
        this.loadTickets(this.currentPage);
      },
      error: (err) => {
        this.isSubmittingComment = false;
        this.toastService.error(err?.error?.message || 'Failed to add comment.');
      }
    });
  }

  deleteComment(commentId: number): void {
    if (!this.selectedTicket) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.ticketService.deleteComment(this.selectedTicket.id, commentId).subscribe({
      next: () => {
        this.toastService.success('Comment deleted.');
        this.loadComments(this.selectedTicket!.id);
        this.loadTickets(this.currentPage);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to delete comment.');
      }
    });
  }

  canDeleteComment(comment: CommentResponse): boolean {
    return this.authService.isAdmin() || this.authService.username() === comment.authorUsername;
  }

  // Attachments

  loadAttachments(ticketId: number): void {
    this.isAttachmentsLoading = true;
    this.ticketService.getAttachments(ticketId).subscribe({
      next: (data) => {
        this.attachments = data;
        this.isAttachmentsLoading = false;
        if (this.selectedTicket) {
          this.selectedTicket.attachmentCount = data.length;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isAttachmentsLoading = false;
        this.toastService.error('Failed to load attachments.');
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.warning('File size cannot exceed 10MB.');
        input.value = '';
        this.selectedFileToUpload = null;
        return;
      }
      this.selectedFileToUpload = file;
    } else {
      this.selectedFileToUpload = null;
    }
  }

  uploadAttachment(fileInput: HTMLInputElement): void {
    if (!this.selectedTicket || !this.selectedFileToUpload) return;

    this.isUploadingAttachment = true;
    this.ticketService.uploadAttachment(this.selectedTicket.id, this.selectedFileToUpload).subscribe({
      next: () => {
        this.isUploadingAttachment = false;
        this.selectedFileToUpload = null;
        fileInput.value = '';
        this.toastService.success('Attachment uploaded successfully.');
        this.loadAttachments(this.selectedTicket!.id);
        this.loadTickets(this.currentPage);
      },
      error: (err) => {
        this.isUploadingAttachment = false;
        this.toastService.error(err?.error?.message || 'Failed to upload attachment.');
      }
    });
  }

  downloadAttachment(att: AttachmentResponse): void {
    if (!this.selectedTicket) return;

    this.ticketService.downloadAttachment(this.selectedTicket.id, att.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = att.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error('Failed to download attachment.');
      }
    });
  }

  deleteAttachment(att: AttachmentResponse): void {
    if (!this.selectedTicket) return;
    if (!confirm(`Are you sure you want to delete "${att.fileName}"?`)) return;

    this.ticketService.deleteAttachment(this.selectedTicket.id, att.id).subscribe({
      next: () => {
        this.toastService.success('Attachment deleted.');
        this.loadAttachments(this.selectedTicket!.id);
        this.loadTickets(this.currentPage);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to delete attachment.');
      }
    });
  }

  canDeleteAttachment(att: AttachmentResponse): boolean {
    return this.authService.isAdmin() || this.authService.username() === att.uploadedByUsername;
  }

  // ==================== HELPERS ====================

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'High': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'Medium': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Low': return 'bg-info-subtle text-info border border-info-subtle';
      default: return 'bg-secondary-subtle text-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'In Review': return 'bg-info-subtle text-info-emphasis border border-info-subtle';
      case 'Resolved': return 'bg-success-subtle text-success border border-success-subtle';
      case 'Cancelled': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-light text-dark';
    }
  }

  private getEmptyCreateRequest(): TicketCreateRequest {
    return {
      title: '',
      description: '',
      category: 'Hardware',
      priority: 'Medium',
      assignedUserId: null
    };
  }

  private getEmptyUpdateRequest(): TicketUpdateRequest {
    return {
      title: '',
      description: '',
      category: 'Hardware',
      priority: 'Medium',
      status: 'Open',
      assignedUserId: null
    };
  }
}
