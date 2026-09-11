import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { finalize } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationResponse } from '../../../models/notification';
import { APP_VERSION } from '../footer/footer';

import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './navbar.html'
})
export class NavbarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  readonly appVersion = APP_VERSION;

  passwordForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Notification state (Signal-based for fine-grained reactivity in zoneless Angular)
  readonly notifications = signal<NotificationResponse[]>([]);
  readonly isNotificationsLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.initForm();
    if (this.authService.isLoggedIn()) {
      this.notificationService.fetchUnreadCount().subscribe();
    }
  }


  initForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  openChangePasswordModal(): void {
    this.passwordForm.reset();
    this.errorMessage = null;
    this.successMessage = null;
    this.isSubmitting = false;
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  onSubmitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = res.message || 'Password changed successfully.';
        this.toastService.success(this.successMessage);
        this.passwordForm.reset();

        setTimeout(() => {
          this.closeModal();
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Password change error:', err);
        this.errorMessage = err.error?.message || 'An error occurred while changing your password.';
        this.toastService.error(this.errorMessage!);
      }
    });
  }

  private closeModal(): void {
    const modalElement = document.getElementById('changePasswordModal');
    if (modalElement) {
      const closeBtn = modalElement.querySelector('.btn-close') as HTMLElement;
      closeBtn?.click();
    }
  }

  // Notification methods

  onOpenNotificationsDropdown(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isNotificationsLoading.set(true);
    this.cdr.markForCheck();

    this.notificationService.getNotifications(0, 15).pipe(
      finalize(() => {
        this.isNotificationsLoading.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (data) => {
        this.notifications.set(data || []);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.notifications.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  handleNotificationClick(n: NotificationResponse): void {
    if (!n.read && !n.isRead) {
      this.notifications.update(items =>
        items.map(item => item.id === n.id ? { ...item, read: true, isRead: true } : item)
      );
      this.notificationService.markAsRead(n.id).subscribe({
        next: () => this.cdr.markForCheck(),
        error: (err) => console.error('Failed to mark notification as read:', err)
      });
    }

    if (n.targetUrl) {
      this.router.navigateByUrl(n.targetUrl);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(items =>
          items.map(item => ({ ...item, read: true, isRead: true }))
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to mark all notifications as read:', err)
    });
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'TICKET_ASSIGNED':
        return 'bi-person-check text-success';
      case 'COMMENT_ADDED':
        return 'bi-chat-left-dots text-info';
      case 'STATUS_CHANGED':
        return 'bi-arrow-repeat text-primary';
      default:
        return 'bi-bell text-secondary';
    }
  }

  getNotificationIconBg(type: string): string {
    switch (type) {
      case 'TICKET_ASSIGNED':
        return 'bg-success-subtle';
      case 'COMMENT_ADDED':
        return 'bg-info-subtle';
      case 'STATUS_CHANGED':
        return 'bg-primary-subtle';
      default:
        return 'bg-secondary-subtle';
    }
  }
}

