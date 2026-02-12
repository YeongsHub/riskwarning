package com.earlywarning.contract;

import com.earlywarning.auth.User;
import com.earlywarning.auth.UserRepository;
import com.earlywarning.common.OpenAiClient;
import com.earlywarning.common.TextChunker;
import com.earlywarning.regulation.Regulation;
import com.earlywarning.regulation.RegulationRepository;
import com.earlywarning.risk.Risk;
import com.earlywarning.risk.RiskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final RiskRepository riskRepository;
    private final RegulationRepository regulationRepository;
    private final UserRepository userRepository;
    private final OpenAiClient openAiClient;
    private final TextChunker textChunker;
    private final AnalysisProgressEmitter progressEmitter;

    @Value("${risk.similarity-threshold}")
    private double similarityThreshold;

    @Transactional
    public Contract uploadAndStartAnalysis(MultipartFile file, String userEmail) throws IOException {
        String content = extractText(file);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Contract contract = new Contract();
        contract.setFilename(file.getOriginalFilename());
        contract.setContent(content);
        contract.setUser(user);
        contract.setStatus(Contract.AnalysisStatus.ANALYZING);
        contractRepository.save(contract);

        return contract;
    }

    @Async
    public void analyzeAsync(Long contractId) {
        try {
            Contract contract = contractRepository.findById(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            progressEmitter.send(contractId, "EXTRACTING", "텍스트 추출 중...", 0, 0);

            List<String> chunks = textChunker.chunk(contract.getContent());
            int totalChunks = chunks.size();

            progressEmitter.send(contractId, "CHUNKING", "텍스트 분석 중...", 0, totalChunks);

            for (int i = 0; i < totalChunks; i++) {
                String chunk = chunks.get(i);
                float[] embedding = openAiClient.createEmbedding(chunk);
                String embeddingStr = Arrays.toString(embedding);

                progressEmitter.send(contractId, "ANALYZING",
                        "규제 비교 중... (" + (i + 1) + "/" + totalChunks + ")",
                        i + 1, totalChunks);

                List<Regulation> matchedRegs = regulationRepository.findSimilar(
                        embeddingStr, similarityThreshold
                );

                if (!matchedRegs.isEmpty()) {
                    List<String> regNames = matchedRegs.stream()
                            .map(r -> r.getName() + ": " + r.getDescription())
                            .toList();

                    progressEmitter.send(contractId, "EVALUATING",
                            "위험도 평가 중... (" + (i + 1) + "/" + totalChunks + ")",
                            i + 1, totalChunks);

                    OpenAiClient.RiskAnalysis analysis = openAiClient.analyzeRisk(chunk, regNames);

                    if (!"NONE".equals(analysis.level())) {
                        Risk risk = new Risk();
                        risk.setContract(contract);
                        risk.setClause(analysis.clause());
                        risk.setLevel(Risk.RiskLevel.valueOf(analysis.level()));
                        risk.setReason(analysis.reason());
                        risk.setSuggestion(analysis.suggestion());
                        riskRepository.save(risk);
                    }
                }
            }

            contract.setStatus(Contract.AnalysisStatus.COMPLETED);
            contractRepository.save(contract);

            progressEmitter.send(contractId, "COMPLETED", "분석 완료", totalChunks, totalChunks);
            progressEmitter.complete(contractId);

        } catch (Exception e) {
            log.error("Analysis failed for contract {}", contractId, e);
            contractRepository.findById(contractId).ifPresent(c -> {
                c.setStatus(Contract.AnalysisStatus.FAILED);
                contractRepository.save(c);
            });
            progressEmitter.send(contractId, "FAILED", "분석 실패: " + e.getMessage(), 0, 0);
            progressEmitter.complete(contractId);
        }
    }

    public List<Contract> findByUserEmail(String userEmail) {
        return contractRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    public Contract findByIdAndUserEmail(Long id, String userEmail) {
        return contractRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + id));
    }

    @Transactional
    public void delete(Long id, String userEmail) {
        Contract contract = findByIdAndUserEmail(id, userEmail);
        riskRepository.deleteByContractId(contract.getId());
        contractRepository.delete(contract);
    }

    private String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                return new PDFTextStripper().getText(doc);
            }
        }
        return new String(file.getBytes());
    }
}
