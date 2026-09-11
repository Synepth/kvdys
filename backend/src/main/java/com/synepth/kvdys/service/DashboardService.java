package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.DashboardStatsResponse;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.AssetRepository;
import com.synepth.kvdys.repository.TicketRepository;
import com.synepth.kvdys.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AssetRepository assetRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    private Long resolveScopedAssetUserId() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        boolean canViewAll = auth.getAuthorities().stream().anyMatch(a ->
                "ASSETS_VIEW_ALL".equals(a.getAuthority()) || "ROLE_ADMIN".equals(a.getAuthority())
        );
        if (canViewAll) return null;
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        return user != null ? user.getId() : -1L;
    }

    private Long resolveScopedTicketUserId() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        boolean canViewAll = auth.getAuthorities().stream().anyMatch(a ->
                "TICKETS_VIEW_ALL".equals(a.getAuthority()) || "ROLE_ADMIN".equals(a.getAuthority())
        );
        if (canViewAll) return null;
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        return user != null ? user.getId() : -1L;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        Long scopedAssetUserId = resolveScopedAssetUserId();
        Long scopedTicketUserId = resolveScopedTicketUserId();

        long total      = assetRepository.countByScopedUser(scopedAssetUserId);
        long active     = assetRepository.countByStatusAndScopedUser("ACTIVE", scopedAssetUserId);
        long inRepair   = assetRepository.countByStatusAndScopedUser("IN_REPAIR", scopedAssetUserId);
        long retired    = assetRepository.countByStatusAndScopedUser("RETIRED", scopedAssetUserId);
        long assigned   = scopedAssetUserId == null ? assetRepository.countByAssignedUserIsNotNull() : total;
        long unassigned = scopedAssetUserId == null ? assetRepository.countByAssignedUserIsNull() : 0L;

        long totalTickets    = ticketRepository.countByScopedUser(scopedTicketUserId);
        long openTickets     = ticketRepository.countByStatusAndScopedUser("Open", scopedTicketUserId);
        long inReviewTickets = ticketRepository.countByStatusAndScopedUser("In Review", scopedTicketUserId);
        long resolvedTickets = ticketRepository.countByStatusAndScopedUser("Resolved", scopedTicketUserId);

        return new DashboardStatsResponse(
                total, active, inRepair, retired, assigned, unassigned,
                totalTickets, openTickets, inReviewTickets, resolvedTickets
        );
    }
}
