package com.synepth.kvdys;

import com.synepth.kvdys.entity.Department;
import com.synepth.kvdys.entity.Role;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.DepartmentRepository;
import com.synepth.kvdys.repository.RoleRepository;
import com.synepth.kvdys.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Roles Initializer
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("ROLE_ADMIN");
                    return roleRepository.save(role);
                });

        roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("ROLE_USER");
                    return roleRepository.save(role);
                });

        // 2. Departments Initializer
        Department itDepartment = departmentRepository.findByName("IT")
                .orElseGet(() -> {
                    Department dept = new Department();
                    dept.setName("IT");
                    return departmentRepository.save(dept);
                });

        departmentRepository.findByName("HR")
                .orElseGet(() -> {
                    Department dept = new Department();
                    dept.setName("HR");
                    return departmentRepository.save(dept);
                });

        // 3. Initial Admin User Initializer
        if (userRepository.count() == 0) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@example.com");
            adminUser.setPassword("password");

            adminUser.setDepartment(itDepartment);

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            adminUser.setRoles(roles);

            userRepository.save(adminUser);
        }
    }
}