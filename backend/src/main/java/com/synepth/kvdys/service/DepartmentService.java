package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.DepartmentResponse;
import com.synepth.kvdys.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(dept -> new DepartmentResponse(dept.getId(), dept.getName()))
                .collect(Collectors.toList());
    }
}