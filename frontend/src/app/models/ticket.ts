export interface TicketResponse {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Review' | 'Resolved' | 'Cancelled';
  createdById?: number;
  createdByUsername?: string;
  createdByName?: string;
  assignedUserId?: number | null;
  assignedUsername?: string | null;
  assignedName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  commentCount: number;
  attachmentCount: number;
}

export interface TicketCreateRequest {
  title: string;
  description: string;
  category: string;
  priority: string;
  assignedUserId?: number | null;
}

export interface TicketUpdateRequest {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedUserId?: number | null;
}

export interface TicketPage {
  content: TicketResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CommentResponse {
  id: number;
  content: string;
  authorId: number;
  authorUsername: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  createdAt: string;
}

export interface CommentCreateRequest {
  content: string;
}

export interface AttachmentResponse {
  id: number;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  uploadedById: number;
  uploadedByUsername: string;
  createdAt: string;
}
