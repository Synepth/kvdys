import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Asset {
  barcode: string;
  name: string;
  category: string;
  assignedTo: string;
  date: string;
  status: 'Active' | 'Under Maintenance' | 'Inactive';
  description?: string;
  location?: string;
}

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assets.component.html'
})
export class AssetsComponent {
  searchTerm = '';
  selectedCategory = 'All Categories';

  selectedAsset: Asset | null = null;
  editAssetModel: Asset = this.getEmptyAsset();

  newAsset: Partial<Asset> = {
    barcode: '',
    name: '',
    category: 'Computer',
    assignedTo: '',
    status: 'Active',
    location: 'Main Office',
    description: ''
  };

  assets: Asset[] = [
    { barcode: 'BR-001', name: 'MacBook Pro 16"', category: 'Computer', assignedTo: 'Ahmet Yıldız', date: '2026-05-10', status: 'Active', location: 'Software Department', description: 'M2 Max processor, 32GB RAM' },
    { barcode: 'BR-002', name: 'HP LaserJet Printer', category: 'Peripheral', assignedTo: 'Mehmet Kaya', date: '2026-01-15', status: 'Under Maintenance', location: 'Human Resources', description: 'Waiting for toner replacement and maintenance.' },
    { barcode: 'BR-003', name: 'Dell 27" 4K Monitor', category: 'Hardware', assignedTo: 'Nilay Demir', date: '2026-03-22', status: 'Active', location: 'Design Team', description: 'Monitor with USB-C hub.' },
    { barcode: 'BR-004', name: 'Cisco IP Phone', category: 'Communication', assignedTo: 'Ayşe Acar', date: '2026-02-18', status: 'Inactive', location: 'Warehouse', description: 'Stored as a backup device.' }
  ];

  get filteredAssets(): Asset[] {
    return this.assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        asset.barcode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        asset.assignedTo.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = this.selectedCategory === 'All Categories' || asset.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  createAsset(): void {
    if (!this.newAsset.barcode || !this.newAsset.name) return;

    const created: Asset = {
      barcode: this.newAsset.barcode,
      name: this.newAsset.name,
      category: this.newAsset.category || 'Computer',
      assignedTo: this.newAsset.assignedTo || 'Unassigned',
      date: new Date().toISOString().split('T')[0],
      status: (this.newAsset.status as 'Active' | 'Under Maintenance' | 'Inactive') || 'Active',
      location: this.newAsset.location || 'Warehouse',
      description: this.newAsset.description || ''
    };

    this.assets.unshift(created);
    this.newAsset = { barcode: '', name: '', category: 'Computer', assignedTo: '', status: 'Active', location: 'Main Office', description: '' };
  }

  openDetailModal(asset: Asset): void {
    this.selectedAsset = { ...asset };
  }

  openEditModal(asset: Asset): void {
    this.editAssetModel = { ...asset };
  }

  updateAsset(): void {
    const index = this.assets.findIndex(a => a.barcode === this.editAssetModel.barcode);
    if (index !== -1) {
      this.assets[index] = { ...this.editAssetModel };
    }
  }

  deleteAsset(barcode: string): void {
    if (confirm(`${barcode} asset will be deleted. Are you sure?`)) {
      this.assets = this.assets.filter(a => a.barcode !== barcode);
    }
  }

  private getEmptyAsset(): Asset {
    return {
      barcode: '',
      name: '',
      category: 'Computer',
      assignedTo: '',
      date: '',
      status: 'Active',
      location: '',
      description: ''
    };
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active': return 'bg-success-subtle text-success border border-success-subtle';
      case 'Under Maintenance': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Inactive': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-light text-dark';
    }
  }
}
