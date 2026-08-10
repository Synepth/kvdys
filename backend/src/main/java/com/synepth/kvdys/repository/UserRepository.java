package com.synepth.kvdys.repository;

import com.synepth.kvdys.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    @Override
    @EntityGraph(attributePaths = {"department", "roles"})
    List<User> findAll();

    @EntityGraph(attributePaths = {"department", "roles"})
    List<User> findAllByOrderByIdAsc();

}