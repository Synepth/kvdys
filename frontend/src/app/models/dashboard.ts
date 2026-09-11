export interface DashboardStats {
  totalAssets: number;
  activeAssets: number;
  inRepairAssets: number;
  retiredAssets: number;
  assignedAssets: number;
  unassignedAssets: number;

  totalTickets?: number;
  openTickets?: number;
  inReviewTickets?: number;
  resolvedTickets?: number;
}
