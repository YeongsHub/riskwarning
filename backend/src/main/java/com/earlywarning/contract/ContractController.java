package com.earlywarning.contract;

import com.earlywarning.risk.Risk;
import com.earlywarning.risk.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;
    private final RiskService riskService;

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            Contract contract = contractService.uploadAndAnalyze(file);
            return ResponseEntity.ok(Map.of(
                    "id", contract.getId(),
                    "filename", contract.getFilename(),
                    "message", "Analysis complete"
            ));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/risks")
    public ResponseEntity<List<RiskDto>> getRisks(@PathVariable Long id) {
        List<Risk> risks = riskService.findByContractId(id);
        List<RiskDto> dtos = risks.stream()
                .map(r -> new RiskDto(r.getId(), r.getClause(), r.getLevel().name()))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    record RiskDto(Long id, String clause, String level) {}
}