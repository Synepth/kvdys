import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Ticket {
  id: string;
  title: string;
  requestedBy: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Review' | 'Resolved' | 'Cancelled';
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
    category: 'Hardware',
    priority: 'Medium',
    requestedBy: '',
    description: ''
  };

  tickets: Ticket[] = [
    { id: 'TCK-101', title: 'Monitor not displaying anything', requestedBy: 'Ahmet Yılmaz', category: 'Hardware', priority: 'High', status: 'Open', createdDate: '2026-08-01', description: 'The monitor power light is on but the screen is completely black.' },
    { id: 'TCK-102', title: 'VPN connection error', requestedBy: 'Elif Kaya', category: 'Network / Internet', priority: 'Medium', status: 'In Review', createdDate: '2026-08-02', description: 'A server timeout error occurs when connecting from home.' },
    { id: 'TCK-103', title: 'Excel license transfer', requestedBy: 'Mehmet Demir', category: 'Software', priority: 'Low', status: 'Resolved', createdDate: '2026-08-03', description: 'Office activation was assigned to the new computer.' },
    { id: 'TCK-104', title: 'Keyboard key sticking', requestedBy: 'Ayşe Şahin', category: 'Hardware', priority: 'Low', status: 'Open', createdDate: '2026-08-04', description: 'The Space and Enter keys are sticking.' }
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
      category: this.newTicket.category || 'General',
      priority: (this.newTicket.priority as 'Low' | 'Medium' | 'High') || 'Medium',
      status: 'Open',
      createdDate: new Date().toISOString().split('T')[0],
      description: this.newTicket.description || ''
    };

    this.tickets.unshift(created);
    this.newTicket = { title: '', category: 'Hardware', priority: 'Medium', requestedBy: '', description: '' };
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
    if (confirm('Are you sure you want to delete this support request?')) {
      this.tickets = this.tickets.filter(t => t.id !== id);
    }
  }

  private getEmptyTicket(): Ticket {
    return {
      id: '',
      title: '',
      requestedBy: '',
      category: 'Hardware',
      priority: 'Medium',
      status: 'Open',
      createdDate: '',
      description: ''
    };
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'High': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'Medium': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Low': return 'bg-info-subtle text-info border border-info-subtle';
      default: return 'bg-secondary-subtle text-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'In Review': return 'bg-info-subtle text-info-emphasis border border-info-subtle';
      case 'Resolved': return 'bg-success-subtle text-success border border-success-subtle';
      case 'Cancelled': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-light text-dark';
    }
  }
}
