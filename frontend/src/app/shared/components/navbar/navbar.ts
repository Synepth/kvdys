import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AppNotification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'ticket' | 'asset' | 'system';
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  notifications: AppNotification[] = [
    { id: 1, title: 'New Request', message: 'TCK-105: A monitor issue record was created.', time: '5 minutes ago', isRead: false, type: 'ticket' },
    { id: 2, title: 'Assignment Updated', message: 'BR-001 MacBook Pro was assigned to you.', time: '1 hour ago', isRead: false, type: 'asset' },
    { id: 3, title: 'Status Changed', message: 'Request TCK-102 was marked as Resolved.', time: '3 hours ago', isRead: true, type: 'ticket' }
  ];

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
  }

  markAsRead(id: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
    }
  }
}
