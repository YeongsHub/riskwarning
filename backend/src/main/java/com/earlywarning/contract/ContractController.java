package com.earlywarning.contract;

import com.earlywarning.risk.Risk;
import com.earlywarning.risk.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import org.springframework.http.HttpHeaders;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;
    private final RiskService riskService;
    private final AnalysisProgressEmitter progressEmitter;

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                     @RequestParam(defaultValue = "GENERAL") String industry,
                                     Principal principal) {
        try {
            Contract contract = contractService.uploadAndStartAnalysis(file, principal.getName(), industry);
            contractService.analyzeAsync(contract.getId());
            return ResponseEntity.ok(Map.of(
                    "id", contract.getId(),
                    "filename", contract.getFilename(),
                    "status", contract.getStatus().name(),
                    "message", "Analysis started"
            ));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ContractSummaryDto>> list(Principal principal) {
        List<Contract> contracts = contractService.findByUserEmail(principal.getName());
        List<ContractSummaryDto> dtos = contracts.stream()
                .map(c -> new ContractSummaryDto(
                        c.getId(),
                        c.getFilename(),
                        c.getStatus().name(),
                        c.getCreatedAt(),
                        new RiskSummaryDto(
                                riskService.countByContractIdAndLevel(c.getId(), Risk.RiskLevel.HIGH),
                                riskService.countByContractIdAndLevel(c.getId(), Risk.RiskLevel.MEDIUM),
                                riskService.countByContractIdAndLevel(c.getId(), Risk.RiskLevel.LOW)
                        )
                ))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractDetailDto> getDetail(@PathVariable Long id, Principal principal) {
        Contract contract = contractService.findByIdAndUserEmail(id, principal.getName());
        return ResponseEntity.ok(new ContractDetailDto(
                contract.getId(),
                contract.getFilename(),
                contract.getContent(),
                contract.getStatus().name(),
                contract.getCreatedAt()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        contractService.delete(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Contract deleted"));
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAll(Principal principal) {
        contractService.deleteAll(principal.getName());
        return ResponseEntity.ok(Map.of("message", "All contracts deleted"));
    }

    @GetMapping("/{id}/risks")
    public ResponseEntity<List<RiskDto>> getRisks(@PathVariable Long id) {
        List<Risk> risks = riskService.findByContractId(id);
        List<RiskDto> dtos = risks.stream()
                .map(r -> new RiskDto(r.getId(), r.getClause(), r.getLevel().name()))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<byte[]> report(@PathVariable Long id, Principal principal) throws IOException {
        byte[] pdf = contractService.generateReport(id, principal.getName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"report-" + id + ".pdf\"")
                .body(pdf);
    }

    @PostMapping("/{id}/reanalyze")
    public ResponseEntity<?> reanalyze(@PathVariable Long id, Principal principal) {
        Contract contract = contractService.reanalyze(id, principal.getName());
        contractService.analyzeAsync(contract.getId());
        return ResponseEntity.ok(Map.of(
                "id", contract.getId(),
                "status", contract.getStatus().name(),
                "message", "Reanalysis started"
        ));
    }

    @GetMapping(value = "/{id}/progress", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter progress(@PathVariable Long id) {
        return progressEmitter.create(id);
    }

    record ContractSummaryDto(Long id, String filename, String status, LocalDateTime createdAt, RiskSummaryDto riskSummary) {}
    record RiskSummaryDto(long high, long medium, long low) {}
    record ContractDetailDto(Long id, String filename, String content, String status, LocalDateTime createdAt) {}
    record RiskDto(Long id, String clause, String level) {}
}
