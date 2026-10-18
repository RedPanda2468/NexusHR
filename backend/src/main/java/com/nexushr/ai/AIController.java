
package com.nexushr.ai;

import com.nexushr.attendance.AttendanceRecord;
import com.nexushr.repository.AttendanceRepository;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasRole('HR_ADMIN')")
public class AIController {

    private final AIService aiService;
    private final AttendanceRepository attendanceRepository;

    public AIController(
            AIService aiService,
            AttendanceRepository attendanceRepository) {
        this.aiService = aiService;
        this.attendanceRepository = attendanceRepository;
    }

    @PostMapping("/test")
    public Map<String, String> testAI(
            @RequestBody Map<String, String> request) {

        String prompt = request.get("prompt");

        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException(
                    "Prompt must not be empty.");
        }

        return Map.of(
                "response",
                aiService.generateResponse(prompt)
        );
    }

    @GetMapping("/workforce-insights")
    public Map<String, Object> workforceInsights(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        if (date == null) {
            date = LocalDate.now();
        }

        List<AttendanceRecord> records =
                attendanceRepository.findByAttendanceDate(date);

        Map<String, Object> stats = buildStatistics(date, records);

        String prompt = """
                You are NexusHR's AI workforce insights assistant.

                Analyze these attendance statistics from the database:
                %s

                Give a concise summary, observations supported by
                the figures, and practical suggestions for HR.

                Do not invent numbers or employee details.
                Do not claim a trend from a single day's data.
                If no records exist, say so clearly.
                """.formatted(stats);

        Map<String, Object> result = new HashMap<>();
        result.put("date", date.toString());
        result.put("statistics", stats);
        result.put("insights", aiService.generateResponse(prompt));

        return result;
    }

    @PostMapping("/chat")
    public Map<String, Object> chat(
            @RequestBody Map<String, String> request) {

        String question = request.get("question");

        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException(
                    "Please enter a question.");
        }

        if (question.length() > 1000) {
            throw new IllegalArgumentException(
                    "Question must be 1000 characters or fewer.");
        }

        LocalDate date = LocalDate.now();

        List<AttendanceRecord> records =
                attendanceRepository.findByAttendanceDate(date);

        Map<String, Object> stats = buildStatistics(date, records);

        String prompt = """
                You are NexusHR, an HR assistant.

                Answer the user's question using only the attendance
                statistics supplied below.

                Today's date: %s
                Attendance statistics: %s

                User's question: %s

                Rules:
                - Use only the supplied statistics for factual claims.
                - Do not invent employee names, numbers, or records.
                - The statistics cover records for today only.
                - They represent recorded attendance, not necessarily
                  the entire workforce.
                - If the question requires data that is not supplied,
                  explain this limitation.
                - Be concise, clear, and professional.
                """.formatted(date, stats, question);

        String answer = aiService.generateResponse(prompt);

        Map<String, Object> result = new HashMap<>();
        result.put("question", question);
        result.put("answer", answer);
        result.put("date", date.toString());
        result.put("statistics", stats);

        return result;
    }

    private Map<String, Object> buildStatistics(
            LocalDate date,
            List<AttendanceRecord> records) {

        Map<String, Object> stats = new HashMap<>();

        stats.put("date", date.toString());
        stats.put("totalRecorded", records.size());
        stats.put("present", countStatus(records, "Present"));
        stats.put("absent", countStatus(records, "Absent"));
        stats.put("late", countStatus(records, "Late"));
        stats.put("leave", countStatus(records, "Leave"));

        return stats;
    }

    private long countStatus(
            List<AttendanceRecord> records,
            String status) {

        return records.stream()
                .filter(record ->
                        status.equalsIgnoreCase(record.getStatus()))
                .count();
    }
}
