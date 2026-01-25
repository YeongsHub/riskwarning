package com.earlywarning.contract;

import com.earlywarning.common.OpenAiClient;
import com.earlywarning.common.TextChunker;
import com.earlywarning.regulation.Regulation;
import com.earlywarning.regulation.RegulationRepository;
import com.earlywarning.risk.Risk;
import com.earlywarning.risk.RiskRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final RiskRepository riskRepository;
    private final RegulationRepository regulationRepository;
    private final OpenAiClient openAiClient;
    private final TextChunker textChunker;

    @Value("${risk.similarity-threshold}")
    private double similarityThreshold;

    @Transactional
    public Contract uploadAndAnalyze(MultipartFile file) throws IOException {
        String content = extractText(file);

        Contract contract = new Contract();
        contract.setFilename(file.getOriginalFilename());
        contract.setContent(content);
        contractRepository.save(contract);

        analyzeContract(contract);

        return contract;
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

    private void analyzeContract(Contract contract) throws IOException {
        List<String> chunks = textChunker.chunk(contract.getContent());

        for (String chunk : chunks) {
            float[] embedding = openAiClient.createEmbedding(chunk);
            String embeddingStr = Arrays.toString(embedding);

            List<Regulation> matchedRegs = regulationRepository.findSimilar(
                    embeddingStr, similarityThreshold
            );

            if (!matchedRegs.isEmpty()) {
                List<String> regNames = matchedRegs.stream()
                        .map(r -> r.getName() + ": " + r.getDescription())
                        .toList();

                OpenAiClient.RiskAnalysis analysis = openAiClient.analyzeRisk(chunk, regNames);

                Risk risk = new Risk();
                risk.setContract(contract);
                risk.setClause(chunk);
                risk.setLevel(Risk.RiskLevel.valueOf(analysis.level()));
                risk.setReason(analysis.reason());
                riskRepository.save(risk);
            }
        }
    }
}