
package com.nexushr.controller;

import com.nexushr.dto.LoginRequest;
import com.nexushr.dto.LoginResponse;
import com.nexushr.model.User;
import com.nexushr.repository.UserRepository;
import com.nexushr.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                            request.email(), request.password()));

            User user = userRepository
                    .findByEmailIgnoreCase(authentication.getName())
                    .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid credentials"));

            return new LoginResponse(
                    jwtService.generateToken(user),
                    user.getEmail(),
                    user.getRole().name());

        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
    }
}
