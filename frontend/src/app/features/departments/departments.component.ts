import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartmentService, DepartmentResponse } from '../../core/services/department.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss']
})
export class DepartmentsComponent implements OnInit {
  departments: DepartmentResponse[] = [];

  // Pagination state
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  isInitialLoading = true;
  isLoading = false;

  // Filter state
  searchTerm = '';

  departmentForm!: FormGroup;
  isEditMode = false;
  selectedDepartmentId: number | null = null;
  errorMessage: string | null = null;

  constructor(
    private departmentService: DepartmentService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDepartments();
  }

  initForm(): void {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]]
    });
  }

  loadDepartments(page = this.currentPage): void {
    this.isLoading = true;
    this.departmentService.getAllDepartments(page, this.pageSize, 'id', this.searchTerm).subscribe({
      next: (data) => {
        this.departments = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.currentPage = data.number;
        this.isLoading = false;
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.isInitialLoading = false;
        console.error('Departments load error:', err);
        this.toastService.error('Failed to load departments');
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(): void {
    this.loadDepartments(0);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.loadDepartments(0);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.loadDepartments(page);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedDepartmentId = null;
    this.errorMessage = null;
    this.departmentForm.reset();
  }

  openEditModal(dept: DepartmentResponse): void {
    this.isEditMode = true;
    this.selectedDepartmentId = dept.id;
    this.errorMessage = null;
    this.departmentForm.patchValue({
      name: dept.name,
      description: dept.description ?? ''
    });
  }

  onSubmit(): void {
    if (this.departmentForm.invalid) return;
    this.errorMessage = null;

    const { name, description } = this.departmentForm.value;

    if (this.isEditMode && this.selectedDepartmentId !== null) {
      this.departmentService.updateDepartment(this.selectedDepartmentId, name, description ?? '').subscribe({
        next: () => {
          this.closeModal();
          this.loadDepartments();
          this.toastService.success('Department updated successfully');
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'An error occurred while updating the department.';
          this.toastService.error(this.errorMessage!);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.departmentService.createDepartment(name, description ?? '').subscribe({
        next: () => {
          this.closeModal();
          this.loadDepartments();
          this.toastService.success('Department created successfully');
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'A department with this name already exists.';
          this.toastService.error(this.errorMessage!);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteDepartment(dept: DepartmentResponse): void {
    const message = dept.userCount > 0
      ? `"${dept.name}" has ${dept.userCount} assigned user${dept.userCount > 1 ? 's' : ''}. Their department will be cleared. Delete anyway?`
      : `Are you sure you want to delete "${dept.name}"?`;

    if (confirm(message)) {
      this.departmentService.deleteDepartment(dept.id).subscribe({
        next: () => {
          this.loadDepartments();
          this.toastService.success(`Department "${dept.name}" deleted successfully`);
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.toastService.error('Failed to delete department');
        }
      });
    }
  }

  private closeModal(): void {
    const modalElement = document.getElementById('departmentModal');
    if (modalElement) {
      const closeButton = modalElement.querySelector('.btn-close') as HTMLElement;
      closeButton?.click();
    }
  }
}
