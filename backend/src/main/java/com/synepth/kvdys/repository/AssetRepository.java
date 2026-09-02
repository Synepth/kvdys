package com.synepth.kvdys.repository;

import com.synepth.kvdys.entity.Asset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    boolean existsBySerialNumber(String serialNumber);

    // Dashboard stats
    long countByStatus(String status);
    long countByAssignedUserIsNotNull();
    long countByAssignedUserIsNull();

    // Recent assets
    java.util.List<Asset> findTop5ByOrderByIdDesc();

    @Query("""
        SELECT a FROM Asset a
        LEFT JOIN a.assignedUser u
        LEFT JOIN a.department d
        WHERE (:search IS NULL OR :search = '' OR
               LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(a.brand) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(a.model) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR :status = '' OR a.status = :status)
          AND (:category IS NULL OR :category = '' OR a.type = :category)
        ORDER BY a.id ASC
        """)
    Page<Asset> findByFilters(@Param("search") String search,
                              @Param("status") String status,
                              @Param("category") String category,
                              Pageable pageable);
}