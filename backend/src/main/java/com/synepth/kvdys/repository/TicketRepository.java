package com.synepth.kvdys.repository;

import com.synepth.kvdys.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    long countByStatus(String status);
    long countByStatusAndAssignedUserId(String status, Long assignedUserId);

    @Query("""
        SELECT t FROM Ticket t
        LEFT JOIN t.createdBy c
        LEFT JOIN t.assignedUser a
        WHERE (:search IS NULL OR :search = '' OR
               CAST(t.id AS string) LIKE CONCAT('%', :search, '%') OR
               LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(c.username) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(a.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(a.lastName) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR :status = '' OR t.status = :status)
          AND (:category IS NULL OR :category = '' OR t.category = :category)
          AND (:priority IS NULL OR :priority = '' OR t.priority = :priority)
          AND (:assignedUserId IS NULL OR a.id = :assignedUserId)
          AND (:unassigned IS NULL OR :unassigned = false OR a.id IS NULL)
        """)
    Page<Ticket> findByFilters(@Param("search") String search,
                               @Param("status") String status,
                               @Param("category") String category,
                               @Param("priority") String priority,
                               @Param("assignedUserId") Long assignedUserId,
                               @Param("unassigned") Boolean unassigned,
                               Pageable pageable);
}