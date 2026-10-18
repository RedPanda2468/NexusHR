package com.nexushr.employee;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeController {
    private final EmployeeRepository employeeRepository;

    public EmployeeController(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
@PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
public List<Employee> getAllEmployees() {
    return employeeRepository.findAll();
}

    @PostMapping
@PreAuthorize("hasRole('HR_ADMIN')")
public Employee addEmployee(@RequestBody Employee employee) {
    return employeeRepository.save(employee);
}

    @DeleteMapping("/{id}")
@PreAuthorize("hasRole('HR_ADMIN')")
public void deleteEmployee(@PathVariable Long id) {
    employeeRepository.deleteById(id);
}

    
}
