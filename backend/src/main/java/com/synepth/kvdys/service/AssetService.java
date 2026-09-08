package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.AssetCreateRequest;
import com.synepth.kvdys.dto.AssetResponse;
import com.synepth.kvdys.entity.Asset;
import com.synepth.kvdys.entity.Department;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.AssetRepository;
import com.synepth.kvdys.repository.DepartmentRepository;
import com.synepth.kvdys.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;

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

    @Transactional(readOnly = true)
    public Page<AssetResponse> getAllAssets(String search, String status, String category, Pageable pageable) {
        return assetRepository.findByFilters(search, status, category, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public AssetResponse createAsset(AssetCreateRequest request) {
        if (assetRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new RuntimeException("Asset with this serial number already exists.");
        }

        Asset asset = new Asset();
        asset.setName(request.getName());
        asset.setBrand(request.getBrand());
        asset.setModel(request.getModel());
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

    @Transactional
    public AssetResponse updateAsset(Long id, AssetCreateRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found."));

        asset.setName(request.getName());
        asset.setBrand(request.getBrand());
        asset.setModel(request.getModel());
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

    @Transactional(readOnly = true)
    public List<AssetResponse> getRecentAssets(int limit) {
        return assetRepository.findTop5ByOrderByIdDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private AssetResponse mapToResponse(Asset asset) {
        String deptName = asset.getDepartment() != null ? asset.getDepartment().getName() : null;
        String username = asset.getAssignedUser() != null ? asset.getAssignedUser().getUsername() : null;
        return new AssetResponse(
                asset.getId(),
                asset.getName(),
                asset.getBrand(),
                asset.getModel(),
                asset.getSerialNumber(),
                asset.getType(),
                asset.getStatus(),
                deptName,
                username
        );
    }

    @Transactional(readOnly = true)
    public byte[] exportAssetsToCsv(String search, String status, String category) {
        org.springframework.data.domain.Pageable unpaged = org.springframework.data.domain.PageRequest.of(0, 10000, org.springframework.data.domain.Sort.by("id").ascending());
        List<Asset> assets = assetRepository.findByFilters(search, status, category, unpaged).getContent();

        StringBuilder sb = new StringBuilder();
        sb.append(com.synepth.kvdys.util.CsvExportUtil.UTF_8_BOM);

        sb.append(com.synepth.kvdys.util.CsvExportUtil.toCsvLine(List.of(
                "ID", "Serial Number", "Brand", "Model", "Asset Name", "Type", "Status", "Department", "Assigned Staff"
        )));

        for (Asset asset : assets) {
            String deptName = asset.getDepartment() != null ? asset.getDepartment().getName() : "";
            String assignedTo = asset.getAssignedUser() != null ? asset.getAssignedUser().getUsername() : "Unassigned";

            sb.append(com.synepth.kvdys.util.CsvExportUtil.toCsvLine(List.of(
                    "#" + asset.getId(),
                    asset.getSerialNumber() != null ? asset.getSerialNumber() : "",
                    asset.getBrand() != null ? asset.getBrand() : "",
                    asset.getModel() != null ? asset.getModel() : "",
                    asset.getName() != null ? asset.getName() : "",
                    asset.getType() != null ? asset.getType() : "",
                    asset.getStatus() != null ? asset.getStatus() : "",
                    deptName,
                    assignedTo
            )));
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}