package com.synepth.kvdys.repository;

import com.synepth.kvdys.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);

    List<Department> findAllByOrderByIdAsc();
    Page<Department> findAllByOrderByIdAsc(Pageable pageable);

    @Query("""
        SELECT d FROM Department d
        WHERE (:search IS NULL OR :search = '' OR
               LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(d.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
               CONCAT('', d.id) LIKE CONCAT('%', :search, '%'))
        ORDER BY d.id ASC
        """)
    Page<Department> findByFilters(@Param("search") String search, Pageable pageable);
}