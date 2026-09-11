package com.synepth.kvdys.controller;

import com.synepth.kvdys.dto.LoginRequest;
import com.synepth.kvdys.dto.LoginResponse;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.UserRepository;
import com.synepth.kvdys.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final com.synepth.kvdys.security.UserDetailsServiceImpl userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        String token = jwtUtil.generateToken(userDetails);

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .toList();

        List<String> permissions = userDetails.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .filter(auth -> !auth.startsWith("ROLE_"))
                .distinct()
                .toList();

        return ResponseEntity.ok(new LoginResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getId(),
                user.getAvatarUrl(),
                roles,
                permissions
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> getCurrentAuth(java.security.Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .toList();

        List<String> permissions = userDetails.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .filter(auth -> !auth.startsWith("ROLE_"))
                .distinct()
                .toList();

        return ResponseEntity.ok(new LoginResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getId(),
                user.getAvatarUrl(),
                roles,
                permissions
        ));
    }
}

