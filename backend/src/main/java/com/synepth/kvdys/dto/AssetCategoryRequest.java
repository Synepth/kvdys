package com.synepth.kvdys.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssetCategoryRequest {

    @NotBlank(message = "Category name is required")
    private String name;

    private String code;

    private String description;
}
