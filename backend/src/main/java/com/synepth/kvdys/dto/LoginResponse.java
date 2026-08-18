package com.synepth.kvdys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String email;
    private Set<String> roles;
    private Long userId;
    private String avatarUrl;
}
