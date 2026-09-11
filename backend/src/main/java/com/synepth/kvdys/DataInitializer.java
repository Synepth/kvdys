package com.synepth.kvdys;

import com.synepth.kvdys.entity.AssetCategory;
import com.synepth.kvdys.entity.Role;
import com.synepth.kvdys.entity.User;
import com.synepth.kvdys.repository.AssetCategoryRepository;
import com.synepth.kvdys.repository.RoleRepository;
import com.synepth.kvdys.repository.UserRepository;
import org.jspecify.annotations.NullMarked;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AssetCategoryRepository assetCategoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           AssetCategoryRepository assetCategoryRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.assetCategoryRepository = assetCategoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @NullMarked
    @Override
    public void run(String... args) {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("ROLE_ADMIN");
                    role.setDescription("System Administrator with complete unrestricted access");
                    return roleRepository.save(role);
                });
        adminRole.setPermissions(new HashSet<>(com.synepth.kvdys.entity.Permission.ALL));
        roleRepository.save(adminRole);

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("ROLE_USER");
                    role.setDescription("Standard employee user with self-service capabilities");
                    return roleRepository.save(role);
                });
        if (userRole.getPermissions() == null || userRole.getPermissions().isEmpty() || userRole.getPermissions().contains("CREATE_TICKETS")) {
            Set<String> perms = userRole.getPermissions() != null ? new HashSet<>(userRole.getPermissions()) : new HashSet<>();
            perms.remove("CREATE_TICKETS");
            perms.add(com.synepth.kvdys.entity.Permission.TICKETS_CREATE);
            userRole.setPermissions(perms);
            roleRepository.save(userRole);
        }

        if (userRepository.count() == 0) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@example.com");
            adminUser.setPassword(passwordEncoder.encode("password"));

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            adminUser.setRoles(roles);

            userRepository.save(adminUser);
        }

        if (assetCategoryRepository.count() == 0) {
            assetCategoryRepository.saveAll(List.of(
                    new AssetCategory(null, "Laptop", "LAPTOP", "High-performance portable workstations and notebooks"),
                    new AssetCategory(null, "Monitor", "MONITOR", "External display monitors and screens"),
                    new AssetCategory(null, "Keyboard", "KEYBOARD", "Mechanical and membrane computer keyboards"),
                    new AssetCategory(null, "Other", "OTHER", "Miscellaneous IT peripherals and accessories")
            ));
        }
    }
}