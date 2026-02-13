package com.earlywarning.risk;

import com.earlywarning.common.OpenAiClient;
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

    @GetMapping("/{id}/negotiation-guide")
    public ResponseEntity<OpenAiClient.NegotiationGuide> getNegotiationGuide(@PathVariable Long id) {
        try {
            OpenAiClient.NegotiationGuide guide = riskService.generateNegotiationGuide(id);
            return ResponseEntity.ok(guide);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    record RiskDetailDto(Long id, String clause, String level, String reason, String suggestion) {}
}