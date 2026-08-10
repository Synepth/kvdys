import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetCreateRequest, AssetResponse } from '../../models/asset';
import { AssetService } from '../../core/services/asset.service';

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

  editAssetModel: AssetCreateRequest = this.getEmptyAssetRequest();
  editAssetId: number | null = null;

  newAsset: AssetCreateRequest = this.getEmptyAssetRequest();

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.assetService.getAllAssets().subscribe({
      next: (data) => {
        this.assets = data;
      },
      error: (err) => console.error('Error loading assets:', err)
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
      error: (err) => console.error('Error creating asset:', err)
    });
  }

  openDetailModal(asset: AssetResponse): void {
    this.selectedAsset = { ...asset };
  }

  openEditModal(asset: AssetResponse): void {
    this.editAssetId = asset.id;
    this.editAssetModel = {
      name: asset.name,
      serialNumber: asset.serialNumber,
      type: asset.type,
      status: asset.status,
      departmentId: null,
      assignedUserId: null
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
      error: (err) => console.error('Error updating asset:', err)
    });
  }

  deleteAsset(id: number, serialNumber: string): void {
    if (confirm(`Asset with serial number ${serialNumber} will be deleted. Are you sure?`)) {
      this.assetService.deleteAsset(id).subscribe({
        next: () => this.loadAssets(),
        error: (err) => console.error('Error deleting asset:', err)
      });
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
      case 'Active':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'IN_REPAIR':
      case 'Under Maintenance':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'RETIRED':
      case 'Inactive':
        return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default:
        return 'bg-light text-dark';
    }
  }
}
