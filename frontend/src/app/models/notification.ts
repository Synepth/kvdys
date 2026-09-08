export interface NotificationResponse {
  id: number;
  recipientId: number;
  actorId?: number | null;
  actorName?: string | null;
  actorUsername?: string | null;
  actorAvatarUrl?: string | null;
  title: string;
  message: string;
  targetUrl?: string | null;
  type: string;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
