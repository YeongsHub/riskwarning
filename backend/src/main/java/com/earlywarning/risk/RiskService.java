package com.earlywarning.risk;

import com.earlywarning.common.OpenAiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskService {

    private final RiskRepository riskRepository;
    private final OpenAiClient openAiClient;

    public List<Risk> findByContractId(Long contractId) {
        return riskRepository.findByContractIdOrderByLevelAsc(contractId);
    }

    public Risk findById(Long id) {
        return riskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Risk not found: " + id));
    }

    public long countByContractIdAndLevel(Long contractId, Risk.RiskLevel level) {
        return riskRepository.countByContractIdAndLevel(contractId, level);
    }

    public OpenAiClient.NegotiationGuide generateNegotiationGuide(Long riskId) throws IOException {
        Risk risk = findById(riskId);
        return openAiClient.generateNegotiationGuide(
                risk.getClause(),
                risk.getLevel().name(),
                risk.getReason(),
                risk.getSuggestion()
        );
    }
}
