package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.DepartmentCreateRequest;
import com.synepth.kvdys.dto.DepartmentResponse;
import com.synepth.kvdys.entity.Department;
import com.synepth.kvdys.repository.DepartmentRepository;
import com.synepth.kvdys.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public List<DepartmentResponse> getAllDepartmentsList() {
        return departmentRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<DepartmentResponse> getAllDepartments(Pageable pageable) {
        return departmentRepository.findAllByOrderByIdAsc(pageable)
                .map(this::mapToResponse);
    }

    public Page<DepartmentResponse> getAllDepartments(String search, Pageable pageable) {
        return departmentRepository.findByFilters(search, pageable)
                .map(this::mapToResponse);
    }

    private DepartmentResponse mapToResponse(Department dept) {
        return new DepartmentResponse(dept.getId(), dept.getName(), dept.getDescription(),
                userRepository.countByDepartmentId(dept.getId()));
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