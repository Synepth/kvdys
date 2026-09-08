package com.synepth.kvdys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalAssets;
    private long activeAssets;
    private long inRepairAssets;
    private long retiredAssets;
    private long assignedAssets;
    private long unassignedAssets;

    // Ticket Statistics
    private long totalTickets;
    private long openTickets;
    private long inReviewTickets;
    private long resolvedTickets;
}
