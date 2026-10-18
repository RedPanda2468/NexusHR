package com.nexushr.leave;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class LeaveRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String employeeName;
    private String employeeEmail;
    private String startDate;
    private String endDate;
    private String reason;
    private String status;

    public LeaveRequest() {
    }

    public LeaveRequest(String employeeName, String startDate, String endDate, String reason) {
        this.employeeName = employeeName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.reason = reason;
        this.status = "Pending";
    }

    
public Long getId() { return id; }
public String getEmployeeName() { return employeeName; }
public String getEmployeeEmail() { return employeeEmail; }
public String getStartDate() { return startDate; }
public String getEndDate() { return endDate; }
public String getReason() { return reason; }
public String getStatus() { return status; }

public void setId(Long id) { this.id = id; }
public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
public void setEmployeeEmail(String employeeEmail) { this.employeeEmail = employeeEmail; }
public void setStartDate(String startDate) { this.startDate = startDate; }
public void setEndDate(String endDate) { this.endDate = endDate; }
public void setReason(String reason) { this.reason = reason; }
public void setStatus(String status) { this.status = status; }

}
