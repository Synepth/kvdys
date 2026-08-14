import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { RoleResponse, RoleCreateRequest } from '../../models/role';
import { ToastService } from '../../core/services/toast.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
  roles: RoleResponse[] = [];
  roleForm!: FormGroup;
  isEditMode = false;
  selectedRoleId: number | null = null;
  errorMessage: string | null = null;

  constructor(private roleService: RoleService, private fb: FormBuilder, private toastService: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
  }
  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: [''],
    })
  }
  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error('Failed to load roles');
      }
    });
  }
  openCreateRoleModal(): void {
    this.isEditMode = false;
    this.selectedRoleId = null;
    this.errorMessage = null;
    this.roleForm.reset();
  }
  openEditModal(role: RoleResponse): void {
    this.isEditMode = true;
    this.selectedRoleId = role.id;
    this.errorMessage = null;
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
    });
  }
  onSubmit(): void {
    if (this.roleForm.invalid) return;
    this.errorMessage = null;

    const payload: RoleCreateRequest = this.roleForm.value;

    if (this.isEditMode && this.selectedRoleId !== null) {
      this.roleService.updateRole(this.selectedRoleId, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadRoles();
          this.toastService.success('Role updated successfully');
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'An error occurred while updating the role.';
          this.toastService.error(this.errorMessage!);
        }
      });
    } else {
      this.roleService.createRole(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadRoles();
          this.toastService.success('Role created successfully');
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'A role with this name already exists.';
          this.toastService.error(this.errorMessage!);
        }
      });
    }
  }

  deleteRole(role: RoleResponse): void {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      this.roleService.deleteRole(role.id).subscribe({
        next: () => {
          this.toastService.success(`Role "${role.name}" deleted successfully`);
          this.loadRoles();
        },
        error: (err) => {
          this.toastService.error(`Failed to delete role "${role.name}"`);
        }
      });
    }
  }
  private closeModal(): void {
    const modalElement = document.getElementById('roleModal');
    if (modalElement) {
      const closeButton = modalElement.querySelector('.btn-close') as HTMLElement;
      closeButton?.click();
    }
    this.roleForm.reset();
    this.errorMessage = null;
  }
}
