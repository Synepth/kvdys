import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';

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

  readonly navItems: SidebarNavItem[] = [
    { label: 'Dashboard', icon: 'bi-speedometer2', route: '/', exact: true },
    { label: 'Assets', icon: 'bi-box-seam', route: '/assets' },
    { label: 'Support Requests', icon: 'bi-life-preserver', route: '/tickets' },
    { label: 'Users', icon: 'bi-people', route: '/users' },
    { label: 'Departments', icon: 'bi-diagram-3', route: '/departments' },
    { label: 'Roles', icon: 'bi-shield-lock', route: '/roles' },
  ];
}
