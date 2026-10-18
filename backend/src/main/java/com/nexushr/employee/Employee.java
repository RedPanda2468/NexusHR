package com.nexushr.employee;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String department;
    private String jobTitle;

    public Employee() {
    }

    public Employee(String name, String email, String department, String jobTitle) {
        this.name = name;
        this.email = email;
        this.department = department;
        this.jobTitle = jobTitle;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getDepartment() { return department; }
    public String getJobTitle() { return jobTitle; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setDepartment(String department) { this.department = department; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
}
