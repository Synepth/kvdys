package com.synepth.kvdys.config;

import com.synepth.kvdys.security.JwtAuthFilter;
import com.synepth.kvdys.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/health").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/v3/api-docs").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        // Profile & self endpoints - allow any authenticated user
                        .requestMatchers("/api/v1/users/me/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/me").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/users/me/avatar").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/change-password").authenticated()
                        // Ticket comment & attachment - author/uploader or admin handled in service
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/tickets/*/comments/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/tickets/*/attachments/*").authenticated()
                        // Administrative mutations protected by permissions or ROLE_ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/v1/users", "/api/v1/users/**").hasAnyAuthority("USERS_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/**").hasAnyAuthority("USERS_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/users/**").hasAnyAuthority("USERS_MANAGE", "ROLE_ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/v1/departments", "/api/v1/departments/**").hasAnyAuthority("DEPARTMENTS_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/departments/**").hasAnyAuthority("DEPARTMENTS_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/departments/**").hasAnyAuthority("DEPARTMENTS_MANAGE", "ROLE_ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/v1/roles", "/api/v1/roles/**").hasAnyAuthority("ROLES_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/roles/**").hasAnyAuthority("ROLES_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/roles/**").hasAnyAuthority("ROLES_MANAGE", "ROLE_ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/api/v1/assets/**").hasAnyAuthority("ASSETS_DELETE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/assets/**").hasAnyAuthority("ASSETS_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/assets/**").hasAnyAuthority("ASSETS_MANAGE", "ROLE_ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/v1/asset-categories", "/api/v1/asset-categories/**").hasAnyAuthority("CATEGORIES_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/asset-categories/**").hasAnyAuthority("CATEGORIES_MANAGE", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/asset-categories/**").hasAnyAuthority("CATEGORIES_MANAGE", "ROLE_ADMIN")

                        // Global fallback delete guard
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/**").hasRole("ADMIN")
                        // Authenticated users (can view/read all resources)
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}