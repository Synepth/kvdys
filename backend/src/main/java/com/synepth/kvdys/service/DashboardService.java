package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.DashboardStatsResponse;
import com.synepth.kvdys.repository.AssetRepository;
import com.synepth.kvdys.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AssetRepository assetRepository;
    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long total      = assetRepository.count();
        long active     = assetRepository.countByStatus("ACTIVE");
        long inRepair   = assetRepository.countByStatus("IN_REPAIR");
        long retired    = assetRepository.countByStatus("RETIRED");
        long assigned   = assetRepository.countByAssignedUserIsNotNull();
        long unassigned = assetRepository.countByAssignedUserIsNull();

        long totalTickets    = ticketRepository.count();
        long openTickets     = ticketRepository.countByStatus("Open");
        long inReviewTickets = ticketRepository.countByStatus("In Review");
        long resolvedTickets = ticketRepository.countByStatus("Resolved");

        return new DashboardStatsResponse(
                total, active, inRepair, retired, assigned, unassigned,
                totalTickets, openTickets, inReviewTickets, resolvedTickets
        );
    }
}
