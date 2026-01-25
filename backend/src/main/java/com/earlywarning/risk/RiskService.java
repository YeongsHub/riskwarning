package com.earlywarning.risk;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskService {

    private final RiskRepository riskRepository;

    public List<Risk> findByContractId(Long contractId) {
        return riskRepository.findByContractIdOrderByLevelAsc(contractId);
    }

    public Risk findById(Long id) {
        return riskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Risk not found: " + id));
    }
}