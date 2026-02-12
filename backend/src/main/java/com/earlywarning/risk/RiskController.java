package com.earlywarning.risk;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
public class RiskController {

    private final RiskService riskService;

    @GetMapping("/{id}")
    public ResponseEntity<RiskDetailDto> getDetail(@PathVariable Long id) {
        Risk risk = riskService.findById(id);
        return ResponseEntity.ok(new RiskDetailDto(
                risk.getId(),
                risk.getClause(),
                risk.getLevel().name(),
                risk.getReason(),
                risk.getSuggestion()
        ));
    }

    record RiskDetailDto(Long id, String clause, String level, String reason, String suggestion) {}
}