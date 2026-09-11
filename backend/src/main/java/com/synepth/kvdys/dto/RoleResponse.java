package com.synepth.kvdys.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private Long id;
    private String name;
    private String description;
    private long userCount;
    private java.util.Set<String> permissions = new java.util.HashSet<>();

}