
package com.nexushr.controller;

import com.nexushr.dto.CreateEmployeeRequest;
import com.nexushr.model.Role;
import com.nexushr.model.User;
import com.nexushr.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/accounts")
public class EmployeeAccountController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeAccountController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/employees")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public Map<String, String> createEmployee(
            @RequestBody CreateEmployeeRequest request) {

        if (request.email() == null
                || request.email().isBlank()
                || !request.email().contains("@")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Enter a valid email address");
        }

        if (request.password() == null
                || request.password().length() < 12) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must be at least 12 characters");
        }

        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Email is already registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.EMPLOYEE);

        User savedUser = userRepository.save(user);

        return Map.of(
                "email", savedUser.getEmail(),
                "role", savedUser.getRole().name(),
                "message", "Employee account created successfully"
        );
    }
}
