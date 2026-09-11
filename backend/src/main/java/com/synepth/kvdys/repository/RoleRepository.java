package com.synepth.kvdys.repository;

import com.synepth.kvdys.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);

    List<Role> findAllByOrderByIdAsc();
    Page<Role> findAllByOrderByIdAsc(Pageable pageable);

    @Query("""
        SELECT r FROM Role r
        WHERE (:search IS NULL OR :search = '' OR
               LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
               CONCAT('', r.id) LIKE CONCAT('%', :search, '%'))
        ORDER BY r.id ASC
        """)
    Page<Role> findByFilters(@Param("search") String search, Pageable pageable);
}