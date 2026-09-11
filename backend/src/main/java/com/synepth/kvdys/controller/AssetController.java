package com.synepth.kvdys.controller;

import com.synepth.kvdys.dto.AssetCreateRequest;
import com.synepth.kvdys.dto.AssetResponse;
import com.synepth.kvdys.service.AssetService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping
    public ResponseEntity<Page<AssetResponse>> getAllAssets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        return ResponseEntity.ok(assetService.getAllAssets(search, status, category, pageable));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportAssetsCsv(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {

        byte[] csvData = assetService.exportAssetsToCsv(search, status, category);
        String filename = "assets_export_" + java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }

    @PostMapping
    public ResponseEntity<AssetResponse> createAsset(@Valid @RequestBody AssetCreateRequest request) {
        return ResponseEntity.ok(assetService.createAsset(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetResponse> updateAsset(@PathVariable Long id, @Valid @RequestBody AssetCreateRequest request) {
        return ResponseEntity.ok(assetService.updateAsset(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recent")
    public ResponseEntity<List<AssetResponse>> getRecentAssets() {
        return ResponseEntity.ok(assetService.getRecentAssets(5));
    }
}