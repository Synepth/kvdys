package com.synepth.kvdys.repository;

import com.synepth.kvdys.entity.User;
import lombok.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    long countByDepartmentId(Long departmentId);
    long countByRolesId(Long roleId);

    @NonNull
    @Override
    @EntityGraph(attributePaths = {"department", "roles"})
    List<User> findAll();

    @EntityGraph(attributePaths = {"department", "roles"})
    List<User> findAllByOrderByIdAsc();

    @EntityGraph(attributePaths = {"department", "roles"})
    Page<User> findAllByOrderByIdAsc(Pageable pageable);

    @EntityGraph(attributePaths = {"department", "roles"})
    @Query("""
        SELECT u FROM User u
        WHERE (:search IS NULL OR :search = '' OR
               LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
               CONCAT('', u.id) LIKE CONCAT('%', :search, '%'))
          AND (:departmentId IS NULL OR u.department.id = :departmentId)
        ORDER BY u.id ASC
        """)
    Page<User> findByFilters(@Param("search") String search,
                             @Param("departmentId") Long departmentId,
                             Pageable pageable);

}