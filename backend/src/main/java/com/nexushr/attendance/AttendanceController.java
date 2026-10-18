
package com.nexushr.attendance;

import com.nexushr.repository.AttendanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:5173")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;

    public AttendanceController(
            AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public List<AttendanceRecord> getAttendance(
            @RequestParam(required = false) String date) {

        LocalDate attendanceDate = (date == null || date.isBlank())
                ? LocalDate.now()
                : LocalDate.parse(date);

        return attendanceRepository.findByAttendanceDate(attendanceDate);
    }

    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<?> saveAttendance(
            @RequestBody AttendanceRecord record) {

        if (record.getEmployeeId() == null
                || record.getEmployeeName() == null
                || record.getEmployeeName().isBlank()
                || record.getAttendanceDate() == null
                || record.getStatus() == null
                || !List.of("Present", "Absent", "Late", "Leave")
                    .contains(record.getStatus())) {
            return ResponseEntity.badRequest()
                    .body("Invalid attendance details.");
        }

        boolean alreadyExists =
                attendanceRepository.existsByEmployeeIdAndAttendanceDate(
                        record.getEmployeeId(),
                        record.getAttendanceDate());

        if (alreadyExists) {
            return ResponseEntity.badRequest()
                    .body("Attendance is already recorded for this employee on this date.");
        }

        AttendanceRecord saved = attendanceRepository.save(record);
        return ResponseEntity.ok(saved);
    }
}
