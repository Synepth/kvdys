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
    { id: 1, title: 'Yeni Talep', message: 'TCK-105: Monitör arızası kaydı açıldı.', time: '5 dk önce', isRead: false, type: 'ticket' },
    { id: 2, title: 'Zimmet Güncellemesi', message: 'BR-001 MacBook Pro üzerinize atandı.', time: '1 saat önce', isRead: false, type: 'asset' },
    { id: 3, title: 'Durum Değişti', message: 'TCK-102 talebi Çözüldü olarak işaretlendi.', time: '3 saat önce', isRead: true, type: 'ticket' }
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
