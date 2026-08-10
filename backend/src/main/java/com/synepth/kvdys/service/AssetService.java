package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.AssetCreateRequest;
import com.synepth.kvdys.dto.AssetResponse;
import com.synepth.kvdys.entity.Asset;
import com.synepth.kvdys.entity.Department;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.AssetRepository;
import com.synepth.kvdys.repository.DepartmentRepository;
import com.synepth.kvdys.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssetService {

    private final AssetRepository assetRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public AssetService(AssetRepository assetRepository, DepartmentRepository departmentRepository, UserRepository userRepository) {
        this.assetRepository = assetRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    public List<AssetResponse> getAllAssets() {
        return assetRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AssetResponse createAsset(AssetCreateRequest request) {
        if (assetRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new RuntimeException("Asset with this serial number already exists.");
        }

        Asset asset = new Asset();
        asset.setName(request.getName());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setType(request.getType());
        asset.setStatus(request.getStatus());

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            asset.setDepartment(dept);
        }

        if (request.getAssignedUserId() != null) {
            User user = userRepository.findById(request.getAssignedUserId()).orElse(null);
            asset.setAssignedUser(user);
        }

        Asset saved = assetRepository.save(asset);
        return mapToResponse(saved);
    }

    public AssetResponse updateAsset(Long id, AssetCreateRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found."));

        asset.setName(request.getName());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setType(request.getType());
        asset.setStatus(request.getStatus());

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            asset.setDepartment(dept);
        } else {
            asset.setDepartment(null);
        }

        if (request.getAssignedUserId() != null) {
            User user = userRepository.findById(request.getAssignedUserId()).orElse(null);
            asset.setAssignedUser(user);
        } else {
            asset.setAssignedUser(null);
        }

        Asset updated = assetRepository.save(asset);
        return mapToResponse(updated);
    }

    public void deleteAsset(Long id) {
        assetRepository.deleteById(id);
    }

    private AssetResponse mapToResponse(Asset asset) {
        String deptName = asset.getDepartment() != null ? asset.getDepartment().getName() : null;
        String username = asset.getAssignedUser() != null ? asset.getAssignedUser().getUsername() : null;
        return new AssetResponse(asset.getId(), asset.getName(), asset.getSerialNumber(), asset.getType(), asset.getStatus(), deptName, username);
    }
}