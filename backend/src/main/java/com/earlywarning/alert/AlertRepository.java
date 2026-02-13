package com.earlywarning.alert;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<RegulationAlert, Long> {

    List<RegulationAlert> findByUserEmailOrderByCreatedAtDesc(String email);

    long countByUserEmailAndReadFalse(String email);

    void deleteByContractId(Long contractId);
}
