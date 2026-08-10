import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { DepartmentService, DepartmentResponse } from '../../core/services/department.service';
import { UserResponse, UserCreateRequest, UserUpdateRequest } from '../../models/user';
import { RoleService } from '../../core/services/role.service';
import { RoleResponse } from '../../models/role';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: UserResponse[] = [];
  departments: DepartmentResponse[] = [];
  availableRoles: RoleResponse[] = [];

  userForm!: FormGroup;
  isEditMode: boolean = false;
  selectedUserId: number | null = null;
  errorMessage: string | null = null;

  constructor(
    private userService: UserService,
    private departmentService: DepartmentService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.loadDepartments();
    this.loadRoles();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      departmentId: [null, [Validators.required]],
      roleId: [2, [Validators.required]]
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Users load error:', err)
    });
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Departments load error:', err)
    });
  }
  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (data) => {
        this.availableRoles = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Roles load error:', err)
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedUserId = null;
    this.errorMessage = null;

    const defaultDeptId = this.departments.length > 0 ? this.departments[0].id : null;

    this.userForm.reset({
      departmentId: defaultDeptId,
      roleId: 2
    });

    this.userForm.get('password')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  openEditModal(user: UserResponse): void {
    this.isEditMode = true;
    this.selectedUserId = user.id;
    this.errorMessage = null;

    const currentDept = this.departments.find(d => d.name === user.departmentName);
    const deptId = currentDept ? currentDept.id : (this.departments.length > 0 ? this.departments[0].id : null);

    const userRoleName = user.roles && user.roles.length > 0 ? user.roles[0] : 'ROLE_USER';
    const foundRole = this.availableRoles.find(r => r.name === userRoleName);
    const roleId = foundRole ? foundRole.id : 2;

    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      departmentId: deptId,
      roleId: roleId
    });

    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;
    this.errorMessage = null;

    const selectedRoleId = Number(this.userForm.value.roleId);

    if (this.isEditMode && this.selectedUserId) {
      const updatePayload: UserUpdateRequest = {
        username: this.userForm.value.username,
        email: this.userForm.value.email,
        departmentId: Number(this.userForm.value.departmentId),
        roleIds: [selectedRoleId]
      };

      this.userService.updateUser(this.selectedUserId, updatePayload).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.errorMessage = err.error?.message || 'An error occurred while updating the user.';
          this.cdr.detectChanges();
        }
      });
    } else {
      const createPayload: UserCreateRequest = {
        username: this.userForm.value.username,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        departmentId: Number(this.userForm.value.departmentId),
        roleIds: [selectedRoleId]
      };

      this.userService.createUser(createPayload).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Create error:', err);
          this.errorMessage = err.error?.message || 'This username or email is already in use.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error('Delete error:', err)
      });
    }
  }

  private closeModal(): void {
    const modalElement = document.getElementById('userModal');
    if (modalElement) {
      const closeButton = modalElement.querySelector('.btn-close') as HTMLElement;
      closeButton?.click();
    }
  }
}
