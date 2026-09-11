import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [noAuthGuard]
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
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
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then(
            (m) => m.UsersComponent
          ),
        canActivate: [permissionGuard('USERS_MANAGE')]
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./features/departments/departments.component').then(
            (m) => m.DepartmentsComponent
          ),
        canActivate: [permissionGuard('DEPARTMENTS_MANAGE')]
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles.component').then(
            (m) => m.RolesComponent
          ),
        canActivate: [permissionGuard('ROLES_MANAGE')]
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      }
    ]
  },
  {
    path: '**',
    redirectTo: '',
  },
];

