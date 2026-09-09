import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    if (authService.hasPermission(requiredPermission)) {
      return true;
    }

    toastService.error('You do not have permission to access this page.');
    return router.createUrlTree(['/']);
  };
};
