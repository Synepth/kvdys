import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'assets',
    loadComponent: () =>
      import('./features/assets/assets.component').then(
        (m) => m.AssetsComponent
      ),
  },
  {
    path: 'tickets',
    loadComponent: () =>
      import('./features/tickets/tickets.component').then(
        (m) => m.TicketsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
