import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../core/services/dashboard.service';
import { TicketService } from '../core/services/ticket.service';
import { AuthService } from '../core/services/auth.service';
import { DashboardStats } from '../models/dashboard';
import { AssetResponse } from '../models/asset';
import { TicketResponse } from '../models/ticket';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentAssets: AssetResponse[] = [];
  recentTickets: TicketResponse[] = [];
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private ticketService: TicketService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: data => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load dashboard stats:', err);
        this.error = 'An error occurred while loading dashboard data.';
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.getRecentAssets().subscribe({
      next: data => {
        this.recentAssets = data;
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load recent assets:', err)
    });

    this.ticketService.getAllTickets(0, 5).subscribe({
      next: data => {
        this.recentTickets = data.content;
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load recent tickets:', err)
    });
  }

  isSelfServiceUser(): boolean {
    return !this.authService.isAdmin() && !this.authService.hasPermission('ASSETS_VIEW_ALL');
  }

  getPercent(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  getAssetStatusBadge(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-success-subtle text-success border border-success-subtle';
      case 'IN_REPAIR': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'RETIRED': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-light text-dark';
    }
  }

  getAssetStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'IN_REPAIR': return 'In Repair';
      case 'RETIRED': return 'Retired';
      default: return status;
    }
  }

  getPriorityBadge(priority: string): string {
    switch (priority) {
      case 'High': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'Medium': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Low': return 'bg-success-subtle text-success border border-success-subtle';
      default: return 'bg-secondary-subtle text-secondary';
    }
  }

  getTicketStatusBadge(status: string): string {
    switch (status) {
      case 'Open': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'In Review': return 'bg-info-subtle text-info-emphasis border border-info-subtle';
      case 'Resolved': return 'bg-success-subtle text-success border border-success-subtle';
      case 'Cancelled': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default: return 'bg-light text-dark';
    }
  }
}

