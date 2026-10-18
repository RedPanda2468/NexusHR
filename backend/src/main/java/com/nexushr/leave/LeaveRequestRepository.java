
package com.nexushr.leave;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findAllByEmployeeNameIgnoreCase(String employeeName);
    List<LeaveRequest> findAllByEmployeeEmailIgnoreCase(String employeeEmail);

}
