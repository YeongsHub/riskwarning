package com.earlywarning.alert;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<AlertDto>> getAlerts(@AuthenticationPrincipal UserDetails userDetails) {
        List<RegulationAlert> alerts = alertService.findByUserEmail(userDetails.getUsername());
        List<AlertDto> dtos = alerts.stream().map(a -> new AlertDto(
                a.getId(),
                a.getContract().getId(),
                a.getContract().getFilename(),
                a.getRegulation().getName(),
                a.getMessage(),
                a.isRead(),
                a.getCreatedAt().toString()
        )).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        long count = alertService.countUnread(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        alertService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        alertService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    record AlertDto(Long id, Long contractId, String contractFilename, String regulationName,
                    String message, boolean read, String createdAt) {}
}
