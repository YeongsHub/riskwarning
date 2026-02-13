package com.earlywarning.dashboard;

import com.earlywarning.contract.Contract;
import com.earlywarning.contract.ContractRepository;
import com.earlywarning.risk.Risk;
import com.earlywarning.risk.RiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ContractRepository contractRepository;
    private final RiskRepository riskRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> stats(Principal principal) {
        String email = principal.getName();

        long totalContracts = contractRepository.countByUserEmail(email);
        long totalRisks = riskRepository.countByUserEmail(email);

        Map<String, Long> risksByLevel = new HashMap<>();
        risksByLevel.put("high", 0L);
        risksByLevel.put("medium", 0L);
        risksByLevel.put("low", 0L);

        List<Object[]> grouped = riskRepository.countByUserEmailGroupByLevel(email);
        for (Object[] row : grouped) {
            Risk.RiskLevel level = (Risk.RiskLevel) row[0];
            Long count = (Long) row[1];
            risksByLevel.put(level.name().toLowerCase(), count);
        }

        List<Contract> recent = contractRepository.findByUserEmailOrderByCreatedAtDesc(email);
        List<RecentContractDto> recentContracts = recent.stream()
                .limit(5)
                .map(c -> new RecentContractDto(
                        c.getId(),
                        c.getFilename(),
                        c.getStatus().name(),
                        c.getCreatedAt()
                ))
                .toList();

        return ResponseEntity.ok(new DashboardStatsDto(
                totalContracts,
                totalRisks,
                risksByLevel,
                recentContracts
        ));
    }

    record DashboardStatsDto(
            long totalContracts,
            long totalRisks,
            Map<String, Long> risksByLevel,
            List<RecentContractDto> recentContracts
    ) {}

    record RecentContractDto(
            Long id,
            String filename,
            String status,
            LocalDateTime createdAt
    ) {}
}
