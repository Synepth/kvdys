package com.synepth.kvdys.controller;

import com.synepth.kvdys.dto.AssetCreateRequest;
import com.synepth.kvdys.dto.AssetResponse;
import com.synepth.kvdys.service.AssetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "http://localhost:4200")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllAssets() {
        return ResponseEntity.ok(assetService.getAllAssets());
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
}