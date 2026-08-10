package com.synepth.kvdys.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssetCreateRequest {

    @NotBlank(message = "Asset name is required")
    private String name;

    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    @NotBlank(message = "Asset type is required")
    private String type;

    @NotBlank(message = "Status is required")
    private String status;

    private Long departmentId;
    private Long assignedUserId;
}