import { Component, OnInit } from '@angular/core';
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
  searchTerm = '';
  selectedCategory = 'All Categories';

  assets: AssetResponse[] = [];
  selectedAsset: AssetResponse | null = null;

  users: UserResponse[] = [];
  departments: DepartmentResponse[] = [];

  editAssetModel: AssetCreateRequest = this.getEmptyAssetRequest();
  editAssetId: number | null = null;

  newAsset: AssetCreateRequest = this.getEmptyAssetRequest();

  errorMessage: string | null = null;

  constructor(
    private assetService: AssetService,
    private userService: UserService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.loadAssets();
    this.loadDropdownData();
  }

  loadAssets(): void {
    this.assetService.getAllAssets().subscribe({
      next: (data) => { this.assets = data; },
      error: () => this.showError('Failed to load assets.')
    });
  }

  loadDropdownData(): void {
    forkJoin({
      users: this.userService.getAllUsers(0, 999),
      departments: this.departmentService.getAllDepartmentsList()
    }).subscribe({
      next: ({ users, departments }) => {
        this.users = users.content;
        this.departments = departments;
      },
      error: () => this.showError('Failed to load users/departments for dropdowns.')
    });
  }

  get filteredAssets(): AssetResponse[] {
    return this.assets.filter(asset => {
      const matchesSearch =
        (asset.name?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
        (asset.serialNumber?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
        (asset.assignedUsername?.toLowerCase() || '').includes(this.searchTerm.toLowerCase());

      const matchesCategory = this.selectedCategory === 'All Categories' || asset.type === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  createAsset(): void {
    if (!this.newAsset.serialNumber || !this.newAsset.name) return;

    this.assetService.createAsset(this.newAsset).subscribe({
      next: () => {
        this.loadAssets();
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
        this.loadAssets();
        this.editAssetId = null;
        this.editAssetModel = this.getEmptyAssetRequest();
      },
      error: (err) => this.showError(err?.error?.message || 'Failed to update asset.')
    });
  }

  deleteAsset(id: number, serialNumber: string): void {
    if (confirm(`Asset with serial number ${serialNumber} will be deleted. Are you sure?`)) {
      this.assetService.deleteAsset(id).subscribe({
        next: () => this.loadAssets(),
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
      serialNumber: '',
      type: 'LAPTOP',
      status: 'ACTIVE',
      departmentId: null,
      assignedUserId: null
    };
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 5000);
  }
}
