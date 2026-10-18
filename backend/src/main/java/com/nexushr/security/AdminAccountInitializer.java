
package com.nexushr.security;

import com.nexushr.model.Role;
import com.nexushr.model.User;
import com.nexushr.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminAccountInitializer {

    @Bean
    CommandLineRunner createInitialAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String adminEmail,
            @Value("${app.admin.password:}") String adminPassword) {

        return args -> {
            boolean adminExists = userRepository.findAll().stream()
                    .anyMatch(user -> user.getRole() == Role.HR_ADMIN);

            if (adminExists) {
                System.out.println("HR Admin already exists; skipping setup.");
                return;
            }

            if (adminEmail.isBlank() || adminPassword.isBlank()) {
                System.out.println(
                    "No initial admin created. Set APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD.");
                return;
            }

            if (adminPassword.length() < 12) {
                throw new IllegalStateException(
                    "Initial admin password must be at least 12 characters.");
            }

            if (userRepository.existsByEmailIgnoreCase(adminEmail)) {
                throw new IllegalStateException(
                    "Admin email already belongs to another user.");
            }

            User admin = new User();
            admin.setEmail(adminEmail.trim().toLowerCase());
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.HR_ADMIN);

            userRepository.save(admin);
            System.out.println("Initial HR Admin account created.");
        };
    }
}
