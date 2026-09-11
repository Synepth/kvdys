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

    long countByType(String type);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Asset a SET a.type = :newType WHERE a.type = :oldType")
    void updateAssetType(@Param("oldType") String oldType, @Param("newType") String newType);

    // Dashboard stats
    long countByStatus(String status);
    long countByAssignedUserIsNotNull();
    long countByAssignedUserIsNull();

    @Query("SELECT COUNT(a) FROM Asset a LEFT JOIN a.assignedUser u WHERE (:assignedUserId IS NULL OR u.id = :assignedUserId)")
    long countByScopedUser(@Param("assignedUserId") Long assignedUserId);

    @Query("SELECT COUNT(a) FROM Asset a LEFT JOIN a.assignedUser u WHERE (:assignedUserId IS NULL OR u.id = :assignedUserId) AND a.status = :status")
    long countByStatusAndScopedUser(@Param("status") String status, @Param("assignedUserId") Long assignedUserId);

    @Query("SELECT a FROM Asset a LEFT JOIN a.assignedUser u WHERE (:assignedUserId IS NULL OR u.id = :assignedUserId) ORDER BY a.id DESC")
    java.util.List<Asset> findRecentAssetsByScopedUser(@Param("assignedUserId") Long assignedUserId, Pageable pageable);

    // Recent assets
    java.util.List<Asset> findTop5ByOrderByIdDesc();

    @Query("""
        SELECT a FROM Asset a
        LEFT JOIN a.assignedUser u
        LEFT JOIN a.department d
        WHERE (:assignedUserId IS NULL OR u.id = :assignedUserId)
          AND (:search IS NULL OR :search = '' OR
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
                              @Param("assignedUserId") Long assignedUserId,
                              Pageable pageable);
}