import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserResponse } from '../../models/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);

  profileForm!: FormGroup;
  user: UserResponse | null = null;
  isLoading = true;
  isSubmitting = false;
  isUploadingAvatar = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  avatarPreview: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private resolveAvatarUrl(avatarUrl?: string | null): string | null {
    if (!avatarUrl) return null;
    return avatarUrl.startsWith('http') ? avatarUrl : 'http://localhost:8080' + avatarUrl;
  }

  loadProfile(): void {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || ''
        });
        this.avatarPreview = this.resolveAvatarUrl(user.avatarUrl);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load profile.';
        console.error('Profile load error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { firstName, lastName, email } = this.profileForm.value;

    this.userService.updateProfile({ firstName, lastName, email }).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        this.user = user;
        this.successMessage = 'Profile updated successfully.';
        this.toastService.success(this.successMessage);

        // Update stored auth data if email changed
        this.authService.updateStoredEmail(email);

        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to update profile.';
        this.toastService.error(this.errorMessage!);
        this.cdr.detectChanges();
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.error('Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('File size must be less than 5MB.');
      return;
    }

    this.isUploadingAvatar = true;
    this.errorMessage = null;

    this.userService.uploadAvatar(file).subscribe({
      next: (user) => {
        this.isUploadingAvatar = false;
        this.user = user;
        this.avatarPreview = this.resolveAvatarUrl(user.avatarUrl);
        this.toastService.success('Avatar uploaded successfully.');

        // Update stored auth data
        this.authService.updateStoredAvatarUrl(user.avatarUrl || null);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        this.toastService.error(err.error?.message || 'Failed to upload avatar.');
        this.cdr.detectChanges();
      }
    });

    // Reset file input
    input.value = '';
  }

  onRemoveAvatar(): void {
    if (!this.user?.avatarUrl) return;

    this.isUploadingAvatar = true;
    this.userService.deleteAvatar().subscribe({
      next: (user) => {
        this.isUploadingAvatar = false;
        this.user = user;
        this.avatarPreview = null;
        this.toastService.success('Avatar removed.');
        this.authService.updateStoredAvatarUrl(null);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        this.toastService.error('Failed to remove avatar.');
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(): string {
    if (!this.user) return '?';
    const first = this.user.firstName?.charAt(0) || '';
    const last = this.user.lastName?.charAt(0) || '';
    if (first || last) return (first + last).toUpperCase();
    return this.user.username.charAt(0).toUpperCase();
  }
}
