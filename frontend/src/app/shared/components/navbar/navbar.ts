import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './navbar.html'
})
export class NavbarComponent implements OnInit {
  passwordForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
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
        this.successMessage = res.message || 'Şifreniz başarıyla değiştirildi.';
        this.toastService.success(this.successMessage);
        this.passwordForm.reset();

        setTimeout(() => {
          this.closeModal();
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Password change error:', err);
        this.errorMessage = err.error?.message || 'Şifre değiştirilirken bir hata oluştu.';
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
}

