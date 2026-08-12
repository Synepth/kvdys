import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartmentService, DepartmentResponse } from '../../core/services/department.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss']
})
export class DepartmentsComponent implements OnInit {
  departments: DepartmentResponse[] = [];
  filteredDepartments: DepartmentResponse[] = [];

  searchTerm = '';

  departmentForm!: FormGroup;
  isEditMode = false;
  selectedDepartmentId: number | null = null;
  errorMessage: string | null = null;

  constructor(
    private departmentService: DepartmentService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
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

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Departments load error:', err)
    });
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredDepartments = [...this.departments];
    } else {
      this.filteredDepartments = this.departments.filter(d =>
        d.name.toLowerCase().includes(term) ||
        (d.description ?? '').toLowerCase().includes(term)
      );
    }
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
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'An error occurred while updating the department.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.departmentService.createDepartment(name, description ?? '').subscribe({
        next: () => {
          this.closeModal();
          this.loadDepartments();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'A department with this name already exists.';
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
        next: () => this.loadDepartments(),
        error: (err) => console.error('Delete error:', err)
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
