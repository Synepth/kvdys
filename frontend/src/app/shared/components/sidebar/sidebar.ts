import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';

export interface SidebarNavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  readonly sidebarService = inject(SidebarService);
  private readonly authService = inject(AuthService);

  readonly navItems = computed<SidebarNavItem[]>(() => {
    const items: SidebarNavItem[] = [
      { label: 'Dashboard', icon: 'bi-speedometer2', route: '/', exact: true },
    ];

    // Assets: "Assets" if staff/admin, "My Assets" for standard users
    const hasAssetsViewAll = this.authService.hasPermission('ASSETS_VIEW_ALL');
    items.push({
      label: hasAssetsViewAll ? 'Assets' : 'My Assets',
      icon: 'bi-box-seam',
      route: '/assets'
    });

    // Tickets: "Support Requests" if staff/admin, "My Requests" for standard users
    const hasTicketsViewAll = this.authService.hasPermission('TICKETS_VIEW_ALL');
    items.push({
      label: hasTicketsViewAll ? 'Support Requests' : 'My Requests',
      icon: 'bi-life-preserver',
      route: '/tickets'
    });

    // Administrative items
    if (this.authService.hasPermission('USERS_MANAGE')) {
      items.push({ label: 'Users', icon: 'bi-people', route: '/users' });
    }

    if (this.authService.hasPermission('DEPARTMENTS_MANAGE')) {
      items.push({ label: 'Departments', icon: 'bi-diagram-3', route: '/departments' });
    }

    if (this.authService.hasPermission('ROLES_MANAGE')) {
      items.push({ label: 'Roles', icon: 'bi-shield-lock', route: '/roles' });
    }

    return items;
  });
}
