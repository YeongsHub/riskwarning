package com.earlywarning.risk;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RiskRepository extends JpaRepository<Risk, Long> {

    List<Risk> findByContractIdOrderByLevelAsc(Long contractId);

    long countByContractIdAndLevel(Long contractId, Risk.RiskLevel level);

    void deleteByContractId(Long contractId);
}
