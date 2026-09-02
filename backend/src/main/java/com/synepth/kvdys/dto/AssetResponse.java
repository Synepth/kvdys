package com.synepth.kvdys.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponse {

    private Long id;
    private String name;
    private String brand;
    private String model;
    private String serialNumber;
    private String type;
    private String status;
    private String departmentName;
    private String assignedUsername;
}