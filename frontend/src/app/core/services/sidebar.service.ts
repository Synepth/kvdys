import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private readonly STORAGE_KEY = 'kvdys_sidebar_collapsed';

  readonly isCollapsed = signal<boolean>(
    typeof window !== 'undefined' && localStorage.getItem(this.STORAGE_KEY) === 'true'
  );

  toggle(): void {
    this.isCollapsed.update(collapsed => {
      const next = !collapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, String(next));
      }
      return next;
    });
  }

  setCollapsed(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, String(collapsed));
    }
  }
}
