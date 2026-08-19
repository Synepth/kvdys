package com.synepth.kvdys.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String username;

    @NotBlank(message = "Mevcut şifre gereklidir")
    private String currentPassword;

    @NotBlank(message = "Yeni şifre gereklidir")
    @Size(min = 6, message = "Yeni şifre en az 6 karakter olmalıdır")
    private String newPassword;
}
