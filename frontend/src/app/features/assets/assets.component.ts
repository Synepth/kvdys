import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Asset {
  barcode: string;
  name: string;
  category: string;
  assignedTo: string;
  date: string;
  status: 'Aktif' | 'Bakımda' | 'Pasif';
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
  selectedCategory = 'Tüm Kategoriler';

  selectedAsset: Asset | null = null;
  editAssetModel: Asset = this.getEmptyAsset();

  newAsset: Partial<Asset> = {
    barcode: '',
    name: '',
    category: 'Bilgisayar',
    assignedTo: '',
    status: 'Aktif',
    location: 'Merkez Ofis',
    description: ''
  };

  assets: Asset[] = [
    { barcode: 'BR-001', name: 'MacBook Pro 16"', category: 'Bilgisayar', assignedTo: 'Ahmet Yıldız', date: '2026-05-10', status: 'Aktif', location: 'Yazılım Departmanı', description: 'M2 Max İşlemci, 32GB RAM' },
    { barcode: 'BR-002', name: 'HP LaserJet Yazıcı', category: 'Çevre Birimi', assignedTo: 'Mehmet Kaya', date: '2026-01-15', status: 'Bakımda', location: 'İnsan Kaynakları', description: 'Toner değişimi ve bakımı bekleniyor.' },
    { barcode: 'BR-003', name: 'Dell 27" 4K Monitör', category: 'Donanım', assignedTo: 'Nilay Demir', date: '2026-03-22', status: 'Aktif', location: 'Tasarım Ekibi', description: 'USB-C Hub özellikli monitör.' },
    { barcode: 'BR-004', name: 'Cisco IP Telefon', category: 'İletişim', assignedTo: 'Ayşe Acar', date: '2026-02-18', status: 'Pasif', location: 'Depo', description: 'Yedek cihaz olarak depoda duruyor.' }
  ];

  get filteredAssets(): Asset[] {
    return this.assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        asset.barcode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        asset.assignedTo.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = this.selectedCategory === 'Tüm Kategoriler' || asset.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  createAsset(): void {
    if (!this.newAsset.barcode || !this.newAsset.name) return;

    const created: Asset = {
      barcode: this.newAsset.barcode,
      name: this.newAsset.name,
      category: this.newAsset.category || 'Bilgisayar',
      assignedTo: this.newAsset.assignedTo || 'Atanmadı',
      date: new Date().toISOString().split('T')[0],
      status: (this.newAsset.status as 'Aktif' | 'Bakımda' | 'Pasif') || 'Aktif',
      location: this.newAsset.location || 'Depo',
      description: this.newAsset.description || ''
    };

    this.assets.unshift(created);
    this.newAsset = { barcode: '', name: '', category: 'Bilgisayar', assignedTo: '', status: 'Aktif', location: 'Merkez Ofis', description: '' };
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
    if (confirm(`${barcode} barkodlu varlığı silmek istediğinize emin misiniz?`)) {
      this.assets = this.assets.filter(a => a.barcode !== barcode);
    }
  }

  private getEmptyAsset(): Asset {
    return {
      barcode: '',
      name: '',
      category: 'Bilgisayar',
      assignedTo: '',
      date: '',
      status: 'Aktif',
      location: '',
      description: ''
    };
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Aktif': return 'bg-success-subtle text-success border border-success-subtle';
      case 'Bakımda': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Pasif': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-light text-dark';
    }
  }
}
