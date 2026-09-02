import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AssetCreateRequest, AssetResponse } from '../../models/asset';
import { AssetService } from '../../core/services/asset.service';
import { UserService } from '../../core/services/user.service';
import { UserResponse } from '../../models/user';
import { DepartmentService, DepartmentResponse } from '../../core/services/department.service';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assets.component.html'
})
export class AssetsComponent implements OnInit {

  // Table data
  assets: AssetResponse[] = [];
  selectedAsset: AssetResponse | null = null;

  // Dropdown data
  users: UserResponse[] = [];
  departments: DepartmentResponse[] = [];

  // Filter state
  searchTerm = '';
  selectedStatus = '';
  selectedCategory = '';

  // Pagination state
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // Forms
  editAssetModel: AssetCreateRequest = this.getEmptyAssetRequest();
  editAssetId: number | null = null;
  newAsset: AssetCreateRequest = this.getEmptyAssetRequest();

  errorMessage: string | null = null;

  constructor(
    private assetService: AssetService,
    private userService: UserService,
    private departmentService: DepartmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssets();
    this.loadDropdownData();
  }

  loadAssets(page = this.currentPage): void {
    this.assetService.getAllAssets(page, this.pageSize, this.searchTerm, this.selectedStatus, this.selectedCategory).subscribe({
      next: (data) => {
        this.assets = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.currentPage = data.number;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Failed to load assets.')
    });
  }

  onFilterChange(): void {
    this.loadAssets(0);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.loadAssets(0);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.loadAssets(page);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  loadDropdownData(): void {
    forkJoin({
      users: this.userService.getAllUsers(0, 999),
      departments: this.departmentService.getAllDepartmentsList()
    }).subscribe({
      next: ({ users, departments }) => {
        this.users = users.content;
        this.departments = departments;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Failed to load users/departments for dropdowns.')
    });
  }

  createAsset(): void {
    if (!this.newAsset.serialNumber || !this.newAsset.name) return;

    this.assetService.createAsset(this.newAsset).subscribe({
      next: () => {
        this.loadAssets(this.currentPage);
        this.newAsset = this.getEmptyAssetRequest();
      },
      error: (err) => this.showError(err?.error?.message || 'Failed to create asset.')
    });
  }

  openDetailModal(asset: AssetResponse): void {
    this.selectedAsset = { ...asset };
  }

  openEditModal(asset: AssetResponse): void {
    this.editAssetId = asset.id;

    const matchedUser = this.users.find(u => u.username === asset.assignedUsername);
    const matchedDept = this.departments.find(d => d.name === asset.departmentName);

    this.editAssetModel = {
      name: asset.name,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      type: asset.type,
      status: asset.status,
      departmentId: matchedDept?.id ?? null,
      assignedUserId: matchedUser?.id ?? null
    };
  }

  updateAsset(): void {
    if (!this.editAssetId) return;

    this.assetService.updateAsset(this.editAssetId, this.editAssetModel).subscribe({
      next: () => {
        this.loadAssets(this.currentPage);
        this.editAssetId = null;
        this.editAssetModel = this.getEmptyAssetRequest();
      },
      error: (err) => this.showError(err?.error?.message || 'Failed to update asset.')
    });
  }

  deleteAsset(id: number, serialNumber: string): void {
    if (confirm(`Asset with serial number ${serialNumber} will be deleted. Are you sure?`)) {
      this.assetService.deleteAsset(id).subscribe({
        next: () => this.loadAssets(this.currentPage),
        error: () => this.showError('Failed to delete asset.')
      });
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Active',
      'IN_REPAIR': 'Under Maintenance',
      'RETIRED': 'Inactive'
    };
    return labels[status] ?? status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'LAPTOP': 'Laptop',
      'MONITOR': 'Monitor',
      'KEYBOARD': 'Keyboard',
      'OTHER': 'Other'
    };
    return labels[type] ?? type;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'IN_REPAIR':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'RETIRED':
        return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default:
        return 'bg-light text-dark';
    }
  }

  private getEmptyAssetRequest(): AssetCreateRequest {
    return {
      name: '',
      brand: '',
      model: '',
      serialNumber: '',
      type: '',
      status: '',
      departmentId: null,
      assignedUserId: null
    };
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 5000);
  }
}
