
package com.nexushr.leave;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "http://localhost:5173")
public class LeaveController {

    private final LeaveRequestRepository leaveRepository;

    public LeaveController(LeaveRequestRepository leaveRepository) {
        this.leaveRepository = leaveRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public List<LeaveRequest> getAllLeaves(Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals("ROLE_HR_ADMIN"));

        if (isAdmin) {
            return leaveRepository.findAll();
        }

        return leaveRepository.findAllByEmployeeEmailIgnoreCase(
        authentication.getName());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public LeaveRequest createLeave(
            @RequestBody LeaveRequest leaveRequest,
            Authentication authentication) {

        leaveRequest.setEmployeeEmail(authentication.getName());
        leaveRequest.setStatus("Pending");

        return leaveRepository.save(leaveRequest);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public LeaveRequest updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        if (!status.equals("Approved")
                && !status.equals("Rejected")
                && !status.equals("Pending")) {
            throw new IllegalArgumentException(
                    "Status must be Pending, Approved, or Rejected");
        }

        LeaveRequest request = leaveRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Leave request not found"));

        request.setStatus(status);

        return leaveRepository.save(request);
    }
}
