import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../core/services/dashboard.service';
import { DashboardStats } from '../models/dashboard';
import { AssetResponse } from '../models/asset';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentAssets: AssetResponse[] = [];
  error: string | null = null;

  constructor(
    private dashboardService: DashboardService,
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
  }

  getPercent(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }
}

