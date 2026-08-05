import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Ticket {
  id: string;
  title: string;
  requestedBy: string;
  category: string;
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  status: 'Açık' | 'İnceleniyor' | 'Çözüldü' | 'İptal';
  createdDate: string;
  description?: string;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.component.html'
})
export class TicketsComponent {
  searchTerm = '';
  selectedStatus = '';

  selectedTicket: Ticket | null = null;
  editTicketModel: Ticket = this.getEmptyTicket();

  newTicket: Partial<Ticket> = {
    title: '',
    category: 'Donanım',
    priority: 'Orta',
    requestedBy: '',
    description: ''
  };

  tickets: Ticket[] = [
    { id: 'TCK-101', title: 'Monitör ekrana görüntü gelmiyor', requestedBy: 'Ahmet Yılmaz', category: 'Donanım', priority: 'Yüksek', status: 'Açık', createdDate: '2026-08-01', description: 'Monitörün güç ışığı yanıyor ancak görüntü tamamen siyah.' },
    { id: 'TCK-102', title: 'VPN bağlantı hatası', requestedBy: 'Elif Kaya', category: 'Ağ / İnternet', priority: 'Orta', status: 'İnceleniyor', createdDate: '2026-08-02', description: 'Evden bağlanırken sunucu zaman aşımı hatası alınıyor.' },
    { id: 'TCK-103', title: 'Excel lisans aktarımı', requestedBy: 'Mehmet Demir', category: 'Yazılım', priority: 'Düşük', status: 'Çözüldü', createdDate: '2026-08-03', description: 'Yeni bilgisayara Office aktivasyonu tanımlandı.' },
    { id: 'TCK-104', title: 'Klavye tuş takılması', requestedBy: 'Ayşe Şahin', category: 'Donanım', priority: 'Düşük', status: 'Açık', createdDate: '2026-08-04', description: 'Space ve Enter tuşları basılı kalıyor.' }
  ];

  get filteredTickets(): Ticket[] {
    return this.tickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        ticket.requestedBy.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.selectedStatus || ticket.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  createTicket(): void {
    if (!this.newTicket.title || !this.newTicket.requestedBy) return;

    const created: Ticket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      title: this.newTicket.title,
      requestedBy: this.newTicket.requestedBy,
      category: this.newTicket.category || 'Genel',
      priority: (this.newTicket.priority as 'Düşük' | 'Orta' | 'Yüksek') || 'Orta',
      status: 'Açık',
      createdDate: new Date().toISOString().split('T')[0],
      description: this.newTicket.description || ''
    };

    this.tickets.unshift(created);
    this.newTicket = { title: '', category: 'Donanım', priority: 'Orta', requestedBy: '', description: '' };
  }

  openDetailModal(ticket: Ticket): void {
    this.selectedTicket = { ...ticket };
  }

  openEditModal(ticket: Ticket): void {
    this.editTicketModel = { ...ticket };
  }

  updateTicket(): void {
    const index = this.tickets.findIndex(t => t.id === this.editTicketModel.id);
    if (index !== -1) {
      this.tickets[index] = { ...this.editTicketModel };
    }
  }

  deleteTicket(id: string): void {
    if (confirm('Bu destek talebini silmek istediğinize emin misiniz?')) {
      this.tickets = this.tickets.filter(t => t.id !== id);
    }
  }

  private getEmptyTicket(): Ticket {
    return {
      id: '',
      title: '',
      requestedBy: '',
      category: 'Donanım',
      priority: 'Orta',
      status: 'Açık',
      createdDate: '',
      description: ''
    };
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'Yüksek': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'Orta': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Düşük': return 'bg-info-subtle text-info border border-info-subtle';
      default: return 'bg-secondary-subtle text-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Açık': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'İnceleniyor': return 'bg-info-subtle text-info-emphasis border border-info-subtle';
      case 'Çözüldü': return 'bg-success-subtle text-success border border-success-subtle';
      case 'İptal': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-light text-dark';
    }
  }
}
