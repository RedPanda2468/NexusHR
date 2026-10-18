
package com.nexushr.dto;

public record LoginResponse(
    String token,
    String email,
    String role
) {}
