package com.earlywarning.alert;

import com.earlywarning.contract.Contract;
import com.earlywarning.contract.ContractRepository;
import com.earlywarning.regulation.Regulation;
import com.earlywarning.regulation.RegulationRepository;
import com.earlywarning.common.OpenAiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final ContractRepository contractRepository;
    private final RegulationRepository regulationRepository;
    private final OpenAiClient openAiClient;

    public List<RegulationAlert> findByUserEmail(String email) {
        return alertRepository.findByUserEmailOrderByCreatedAtDesc(email);
    }

    public long countUnread(String email) {
        return alertRepository.countByUserEmailAndReadFalse(email);
    }

    @Transactional
    public void markAsRead(Long alertId) {
        alertRepository.findById(alertId).ifPresent(alert -> {
            alert.setRead(true);
            alertRepository.save(alert);
        });
    }

    @Transactional
    public void markAllAsRead(String email) {
        List<RegulationAlert> unread = alertRepository.findByUserEmailOrderByCreatedAtDesc(email);
        for (RegulationAlert alert : unread) {
            if (!alert.isRead()) {
                alert.setRead(true);
                alertRepository.save(alert);
            }
        }
    }

    @Transactional
    public void createAlertsForUpdatedRegulation(Regulation regulation) {
        List<Contract> completedContracts = contractRepository.findByStatus(Contract.AnalysisStatus.COMPLETED);

        for (Contract contract : completedContracts) {
            try {
                // Check similarity between regulation embedding and contract content embedding
                String embeddingStr = Arrays.toString(regulation.getEmbedding());
                List<Regulation> similar = regulationRepository.findSimilar(embeddingStr, 0.8);

                // If regulation itself is found (it will be), this contract may be affected
                // Create an alert for the contract's user
                RegulationAlert alert = new RegulationAlert();
                alert.setUser(contract.getUser());
                alert.setContract(contract);
                alert.setRegulation(regulation);
                alert.setMessage("규제 '" + regulation.getName() + "'이(가) 업데이트되었습니다. " +
                        "계약서 '" + contract.getFilename() + "'에 영향을 줄 수 있으므로 재분석을 권장합니다.");
                alertRepository.save(alert);

                log.info("Alert created for contract {} due to regulation update: {}",
                        contract.getFilename(), regulation.getName());
            } catch (Exception e) {
                log.error("Failed to create alert for contract {}", contract.getId(), e);
            }
        }
    }
}
