package com.earlywarning.contract;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByUserEmailOrderByCreatedAtDesc(String email);

    Optional<Contract> findByIdAndUserEmail(Long id, String email);
}
