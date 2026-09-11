package com.synepth.kvdys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String email;
    private Long userId;
    private String avatarUrl;
    private List<String> roles;
    private List<String> permissions;
}
