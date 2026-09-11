import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { RoleResponse, RoleCreateRequest } from '../../models/role';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface PermissionItem {
  code: string;
  name: string;
  description: string;
}

export interface PermissionCategory {
  name: string;
  description: string;
  permissions: PermissionItem[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Administration',
    description: 'Core system administration and access control',
    permissions: [
      { code: 'USERS_MANAGE', name: 'Manage Users', description: 'Create, update, and manage system users and role assignments' },
      { code: 'DEPARTMENTS_MANAGE', name: 'Manage Departments', description: 'Create, edit, and organize corporate departments' },
      { code: 'ROLES_MANAGE', name: 'Manage Roles', description: 'Configure system access roles and permission profiles' }
    ]
  },
  {
    name: 'Corporate Assets',
    description: 'Hardware, software, and physical equipment tracking',
    permissions: [
      { code: 'ASSETS_VIEW_ALL', name: 'View All Assets', description: 'Access all corporate inventory; otherwise only assigned equipment' },
      { code: 'ASSETS_MANAGE', name: 'Manage Assets', description: 'Register new assets and update asset metadata' },
      { code: 'ASSETS_DELETE', name: 'Delete Assets', description: 'Permanently remove assets from inventory' },
      { code: 'CATEGORIES_MANAGE', name: 'Manage Asset Categories', description: 'Add, edit, or delete dynamic corporate asset categories' }
    ]
  },
  {
    name: 'Support Requests',
    description: 'Helpdesk ticketing and issue resolution workflows',
    permissions: [
      { code: 'TICKETS_VIEW_ALL', name: 'View All Tickets', description: 'Access all corporate tickets; otherwise only own requests' },
      { code: 'TICKETS_MANAGE', name: 'Manage Tickets', description: 'Change statuses, assign tickets, and take ownership' },
      { code: 'TICKETS_CREATE', name: 'Create Tickets', description: 'Submit new support requests' }
    ]
  },
  {
    name: 'Reporting & Export',
    description: 'Data reporting and spreadsheet exports',
    permissions: [
      { code: 'REPORTS_EXPORT', name: 'Export CSV Reports', description: 'Download CSV reports for assets and support requests' }
    ]
  }
];

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
  isInitialLoading = true;

  readonly permissionCategories = PERMISSION_CATEGORIES;
  selectedPermissions = new Set<string>();

  private permissionMap = new Map<string, string>();

  constructor(
    private roleService: RoleService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {
    for (const cat of PERMISSION_CATEGORIES) {
      for (const p of cat.permissions) {
        this.permissionMap.set(p.code, p.name);
      }
    }
  }

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
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isInitialLoading = false;
        this.toastService.error('Failed to load roles');
        this.cdr.detectChanges();
      }
    });
  }
  openCreateRoleModal(): void {
    this.isEditMode = false;
    this.selectedRoleId = null;
    this.errorMessage = null;
    this.selectedPermissions.clear();
    this.roleForm.reset();
  }
  openEditModal(role: RoleResponse): void {
    this.isEditMode = true;
    this.selectedRoleId = role.id;
    this.errorMessage = null;
    this.selectedPermissions = new Set(role.permissions || []);
    if (role.name === 'ROLE_ADMIN') {
      for (const cat of this.permissionCategories) {
        for (const p of cat.permissions) {
          this.selectedPermissions.add(p.code);
        }
      }
    }
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
    });
  }

  isRoleAdmin(): boolean {
    return this.isEditMode && this.roleForm.get('name')?.value === 'ROLE_ADMIN';
  }

  isPermissionSelected(code: string): boolean {
    return this.selectedPermissions.has(code);
  }

  togglePermission(code: string): void {
    if (this.isRoleAdmin()) return;
    if (this.selectedPermissions.has(code)) {
      this.selectedPermissions.delete(code);
    } else {
      this.selectedPermissions.add(code);
    }
  }

  selectAllPermissions(): void {
    if (this.isRoleAdmin()) return;
    for (const cat of this.permissionCategories) {
      for (const p of cat.permissions) {
        this.selectedPermissions.add(p.code);
      }
    }
  }

  deselectAllPermissions(): void {
    if (this.isRoleAdmin()) return;
    this.selectedPermissions.clear();
  }

  getCategorySelectedCount(cat: PermissionCategory): number {
    return cat.permissions.filter(p => this.selectedPermissions.has(p.code)).length;
  }

  formatPermissionName(code: string): string {
    return this.permissionMap.get(code) || code;
  }

  onSubmit(): void {
    if (this.roleForm.invalid) return;
    this.errorMessage = null;

    const payload: RoleCreateRequest = {
      ...this.roleForm.value,
      permissions: Array.from(this.selectedPermissions)
    };

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
    this.selectedPermissions.clear();
    this.errorMessage = null;
  }
}
