package com.synepth.kvdys.repository;

import com.synepth.kvdys.entity.AssetCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetCategoryRepository extends JpaRepository<AssetCategory, Long> {
    Optional<AssetCategory> findByName(String name);
    Optional<AssetCategory> findByCode(String code);
    boolean existsByName(String name);
    boolean existsByCode(String code);
    List<AssetCategory> findAllByOrderByNameAsc();
}
