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

    @Query("""
        SELECT t FROM Ticket t
        LEFT JOIN t.createdBy c
        LEFT JOIN t.assignedUser a
        WHERE (:search IS NULL OR :search = '' OR
               LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(c.username) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR :status = '' OR t.status = :status)
          AND (:category IS NULL OR :category = '' OR t.category = :category)
          AND (:priority IS NULL OR :priority = '' OR t.priority = :priority)
        ORDER BY t.id ASC
        """)
    Page<Ticket> findByFilters(@Param("search") String search,
                               @Param("status") String status,
                               @Param("category") String category,
                               @Param("priority") String priority,
                               Pageable pageable);
}