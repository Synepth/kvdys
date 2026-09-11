package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.AssetCategoryRequest;
import com.synepth.kvdys.dto.AssetCategoryResponse;
import com.synepth.kvdys.entity.AssetCategory;
import com.synepth.kvdys.repository.AssetCategoryRepository;
import com.synepth.kvdys.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetCategoryService {

    private final AssetCategoryRepository categoryRepository;
    private final AssetRepository assetRepository;

    @Transactional(readOnly = true)
    public List<AssetCategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssetCategoryResponse getCategoryById(Long id) {
        AssetCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset category not found with id: " + id));
        return mapToResponse(category);
    }

    @Transactional
    public AssetCategoryResponse createCategory(AssetCategoryRequest request) {
        String name = request.getName().trim();
        String code = generateOrNormalizeCode(request.getCode(), name);

        if (categoryRepository.existsByName(name)) {
            throw new RuntimeException("Category with name '" + name + "' already exists.");
        }
        if (categoryRepository.existsByCode(code)) {
            throw new RuntimeException("Category with code '" + code + "' already exists.");
        }

        AssetCategory category = new AssetCategory();
        category.setName(name);
        category.setCode(code);
        category.setDescription(request.getDescription() != null && !request.getDescription().trim().isEmpty()
                ? request.getDescription().trim()
                : null);

        AssetCategory saved = categoryRepository.save(category);
        return mapToResponse(saved);
    }

    @Transactional
    public AssetCategoryResponse updateCategory(Long id, AssetCategoryRequest request) {
        AssetCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset category not found with id: " + id));

        String newName = request.getName().trim();
        String newCode = generateOrNormalizeCode(request.getCode(), newName);

        categoryRepository.findByName(newName).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new RuntimeException("Category with name '" + newName + "' already exists.");
            }
        });

        categoryRepository.findByCode(newCode).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new RuntimeException("Category with code '" + newCode + "' already exists.");
            }
        });

        String oldCode = category.getCode();
        if (!oldCode.equals(newCode)) {
            // Propagate code change to all assets currently using oldCode
            assetRepository.updateAssetType(oldCode, newCode);
        }

        category.setName(newName);
        category.setCode(newCode);
        category.setDescription(request.getDescription() != null && !request.getDescription().trim().isEmpty()
                ? request.getDescription().trim()
                : null);

        AssetCategory saved = categoryRepository.save(category);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteCategory(Long id) {
        AssetCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset category not found with id: " + id));

        long inUseCount = assetRepository.countByType(category.getCode());
        if (inUseCount > 0) {
            throw new RuntimeException("Cannot delete category '" + category.getName() + "' because it is currently assigned to " + inUseCount + " asset(s). Reassign or delete those assets first.");
        }

        categoryRepository.delete(category);
    }

    private String generateOrNormalizeCode(String providedCode, String name) {
        if (providedCode != null && !providedCode.trim().isEmpty()) {
            return providedCode.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]", "_");
        }
        return name.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9_]", "_")
                .replaceAll("_+", "_");
    }

    private AssetCategoryResponse mapToResponse(AssetCategory cat) {
        long count = assetRepository.countByType(cat.getCode());
        return new AssetCategoryResponse(cat.getId(), cat.getName(), cat.getCode(), cat.getDescription(), count);
    }
}
