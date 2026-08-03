package com.synepth.kvdys.controller;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public Map<String, String> checkHealth() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "KVDYS Aktif");
        return response;
    }
}
