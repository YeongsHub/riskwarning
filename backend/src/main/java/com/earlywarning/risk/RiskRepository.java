package com.earlywarning.risk;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RiskRepository extends JpaRepository<Risk, Long> {

    List<Risk> findByContractIdOrderByLevelAsc(Long contractId);

    long countByContractIdAndLevel(Long contractId, Risk.RiskLevel level);

    void deleteByContractId(Long contractId);

    @Query("SELECT r.level, COUNT(r) FROM Risk r WHERE r.contract.user.email = :email GROUP BY r.level")
    List<Object[]> countByUserEmailGroupByLevel(@Param("email") String email);

    @Query("SELECT COUNT(r) FROM Risk r WHERE r.contract.user.email = :email")
    long countByUserEmail(@Param("email") String email);
}
