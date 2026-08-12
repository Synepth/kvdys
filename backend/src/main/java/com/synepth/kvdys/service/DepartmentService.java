package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.DepartmentCreateRequest;
import com.synepth.kvdys.dto.DepartmentResponse;
import com.synepth.kvdys.entity.Department;
import com.synepth.kvdys.repository.DepartmentRepository;
import com.synepth.kvdys.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public DepartmentService(DepartmentRepository departmentRepository, UserRepository userRepository) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(dept -> new DepartmentResponse(dept.getId(), dept.getName(), dept.getDescription(),
                        userRepository.countByDepartmentId(dept.getId())))
                .collect(Collectors.toList());
    }

    public DepartmentResponse createDepartment(DepartmentCreateRequest request) {
        if (departmentRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("A department with this name already exists.");
        }
        Department department = new Department();
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        Department saved = departmentRepository.save(department);
        return new DepartmentResponse(saved.getId(), saved.getName(), saved.getDescription(),
                userRepository.countByDepartmentId(saved.getId()));
    }

    public DepartmentResponse updateDepartment(Long id, DepartmentCreateRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        Department saved = departmentRepository.save(department);
        return new DepartmentResponse(saved.getId(), saved.getName(), saved.getDescription(),
                userRepository.countByDepartmentId(saved.getId()));
    }

    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new RuntimeException("Department not found with id: " + id);
        }
        departmentRepository.deleteById(id);
    }
}