package com.synepth.kvdys.service;

import com.synepth.kvdys.dto.RoleCreateRequest;
import com.synepth.kvdys.dto.RoleResponse;
import com.synepth.kvdys.entity.Role;
import com.synepth.kvdys.repository.RoleRepository;
import com.synepth.kvdys.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public RoleService(RoleRepository roleRepository, UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
    }

    public List<RoleResponse> getAllRolesList() {
        return roleRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<RoleResponse> getAllRoles(String search, Pageable pageable) {
        return roleRepository.findByFilters(search, pageable)
                .map(this::mapToResponse);
    }

    private RoleResponse mapToResponse(Role role) {
        long userCount = userRepository.countByRolesId(role.getId());
        RoleResponse res = new RoleResponse();
        res.setId(role.getId());
        res.setName(role.getName());
        res.setDescription(role.getDescription());
        res.setUserCount(userCount);
        res.setPermissions(role.getPermissions() != null ? new java.util.HashSet<>(role.getPermissions()) : new java.util.HashSet<>());
        return res;
    }

    @org.springframework.transaction.annotation.Transactional
    public RoleResponse createRole(RoleCreateRequest request) {
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("A role with this name already exists.");
        }
        Role role = new Role();
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        if (request.getPermissions() != null) {
            role.setPermissions(new java.util.HashSet<>(request.getPermissions()));
        }
        Role saved = roleRepository.save(role);
        return mapToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public RoleResponse updateRole(Long id, RoleCreateRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        roleRepository.findByName(request.getName())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("A role with this name already exists.");
                });

        role.setName(request.getName());
        role.setDescription(request.getDescription());
        if ("ROLE_ADMIN".equalsIgnoreCase(role.getName())) {
            role.setPermissions(new java.util.HashSet<>(com.synepth.kvdys.entity.Permission.ALL));
        } else if (request.getPermissions() != null) {
            role.setPermissions(new java.util.HashSet<>(request.getPermissions()));
        }
        Role saved = roleRepository.save(role);
        return mapToResponse(saved);
    }

    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        if (role.getName().equals("ROLE_ADMIN") || role.getName().equals("ROLE_USER")) {
            throw new RuntimeException("System roles ROLE_ADMIN and ROLE_USER cannot be deleted.");
        }
        if (userRepository.countByRolesId(id) > 0) {
            throw new RuntimeException("Cannot delete role because users are currently assigned to it.");
        }
        roleRepository.deleteById(id);
    }
}