
package com.nexushr.repository;

import com.nexushr.attendance.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository
        extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByAttendanceDate(LocalDate attendanceDate);

    boolean existsByEmployeeIdAndAttendanceDate(
            Long employeeId,
            LocalDate attendanceDate
    );
}
