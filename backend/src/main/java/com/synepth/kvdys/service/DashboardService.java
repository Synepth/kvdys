package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.DashboardStatsResponse;
import com.synepth.kvdys.repository.AssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final AssetRepository assetRepository;

    public DashboardService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long total      = assetRepository.count();
        long active     = assetRepository.countByStatus("ACTIVE");
        long inRepair   = assetRepository.countByStatus("IN_REPAIR");
        long retired    = assetRepository.countByStatus("RETIRED");
        long assigned   = assetRepository.countByAssignedUserIsNotNull();
        long unassigned = assetRepository.countByAssignedUserIsNull();

        return new DashboardStatsResponse(total, active, inRepair, retired, assigned, unassigned);
    }
}
