package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.UserCreateRequest;
import com.synepth.kvdys.dto.UserResponse;
import com.synepth.kvdys.dto.UserUpdateRequest;
import com.synepth.kvdys.entity.Department;
import com.synepth.kvdys.entity.Role;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.DepartmentRepository;
import com.synepth.kvdys.repository.RoleRepository;
import com.synepth.kvdys.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;

    public UserResponse createUser(UserCreateRequest request) {
        Department department = getDepartmentById(request.getDepartmentId());
        Set<Role> roles = getRolesByIds(request.getRoleIds());

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setDepartment(department);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        Department department = getDepartmentById(request.getDepartmentId());
        Set<Role> roles = getRolesByIds(request.getRoleIds());

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setDepartment(department);
        user.setRoles(roles);

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    private Department getDepartmentById(Long departmentId) {
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found: " + departmentId));
    }

    private Set<Role> getRolesByIds(Set<Long> roleIds) {
        Set<Role> roles = new HashSet<>();
        if (roleIds != null && !roleIds.isEmpty()) {
            roles.addAll(roleRepository.findAllById(roleIds));
        }
        return roles;
    }

    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        if (user.getDepartment() != null) {
            response.setDepartmentName(user.getDepartment().getName());
        }
        if (user.getRoles() != null) {
            response.setRoles(user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toSet()));
        }
        return response;
    }
}