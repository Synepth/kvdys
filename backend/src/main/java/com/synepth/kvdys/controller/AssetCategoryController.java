package com.synepth.kvdys.controller;

import com.synepth.kvdys.dto.AssetCategoryRequest;
import com.synepth.kvdys.dto.AssetCategoryResponse;
import com.synepth.kvdys.service.AssetCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/asset-categories")
@RequiredArgsConstructor
@Tag(name = "Asset Categories", description = "Endpoints for managing corporate asset categories")
public class AssetCategoryController {

    private final AssetCategoryService categoryService;

    @GetMapping
    @Operation(summary = "Get all asset categories")
    public ResponseEntity<List<AssetCategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get asset category by ID")
    public ResponseEntity<AssetCategoryResponse> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('CATEGORIES_MANAGE', 'ROLE_ADMIN')")
    @Operation(summary = "Create a new asset category")
    public ResponseEntity<AssetCategoryResponse> createCategory(@Valid @RequestBody AssetCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('CATEGORIES_MANAGE', 'ROLE_ADMIN')")
    @Operation(summary = "Update an existing asset category")
    public ResponseEntity<AssetCategoryResponse> updateCategory(@PathVariable Long id, @Valid @RequestBody AssetCategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('CATEGORIES_MANAGE', 'ROLE_ADMIN')")
    @Operation(summary = "Delete an asset category")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
