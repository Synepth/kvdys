import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AssetCreateRequest, AssetResponse } from '../../models/asset';
import { AssetService } from '../../core/services/asset.service';
import { UserService } from '../../core/services/user.service';
import { UserResponse } from '../../models/user';
import { DepartmentService, DepartmentResponse } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assets.component.html'
})
export class AssetsComponent implements OnInit, OnDestroy {

  // Table data & pagination
  assets: AssetResponse[] = [];
  selectedAsset: AssetResponse | null = null;
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  isInitialLoading = true;
  isLoading = false;

  // Dropdown data
  users: UserResponse[] = [];
  departments: DepartmentResponse[] = [];

  // Filter state
  searchTerm = '';
  selectedStatus = '';
  selectedCategory = '';

  // RxJS Debounce & Cleanup
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Forms
  editAssetModel: AssetCreateRequest = this.getEmptyAssetRequest();
  editAssetId: number | null = null;
  newAsset: AssetCreateRequest = this.getEmptyAssetRequest();

  constructor(
    private assetService: AssetService,
    private userService: UserService,
    private departmentService: DepartmentService,
    public authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Debounced real-time search
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((term) => {
      this.searchTerm = term;
      this.loadAssets(0);
    });

    // 2. Initial load
    this.loadAssets();
    this.loadDropdownData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  loadAssets(page = this.currentPage): void {
    this.isLoading = true;
    this.assetService.getAllAssets(page, this.pageSize, this.searchTerm, this.selectedStatus, this.selectedCategory).subscribe({
      next: (data) => {
        this.assets = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.currentPage = data.number;
        this.isLoading = false;
        this.isInitialLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.isInitialLoading = false;
        this.toastService.error('Failed to load assets.');
        this.cdr.detectChanges();
      }
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
      error: () => this.toastService.warning('Failed to load users or departments for dropdowns.')
    });
  }

  openCreateModal(): void {
    this.newAsset = this.getEmptyAssetRequest();
  }

  createAsset(): void {
    if (!this.newAsset.serialNumber?.trim() || !this.newAsset.name?.trim()) {
      this.toastService.warning('Asset Name and Serial Number are required.');
      return;
    }

    this.assetService.createAsset(this.newAsset).subscribe({
      next: () => {
        this.toastService.success('Asset created successfully.');
        this.loadAssets(0);
        this.newAsset = this.getEmptyAssetRequest();
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Failed to create asset.')
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
      next: (updated) => {
        this.toastService.success('Asset updated successfully.');
        this.loadAssets(this.currentPage);
        if (this.selectedAsset && this.selectedAsset.id === updated.id) {
          this.selectedAsset = { ...updated };
        }
        this.editAssetId = null;
        this.editAssetModel = this.getEmptyAssetRequest();
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Failed to update asset.')
    });
  }

  deleteAsset(asset: AssetResponse): void {
    if (!confirm(`Are you sure you want to delete asset "${asset.name}" (${asset.serialNumber})?`)) {
      return;
    }

    this.assetService.deleteAsset(asset.id).subscribe({
      next: () => {
        this.toastService.success(`Asset "${asset.name}" deleted successfully.`);
        this.loadAssets(this.currentPage);
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Failed to delete asset.')
    });
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
}
