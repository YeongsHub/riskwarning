package com.earlywarning.contract;

import com.earlywarning.alert.AlertRepository;
import com.earlywarning.auth.User;
import com.earlywarning.auth.UserRepository;
import com.earlywarning.common.OpenAiClient;
import com.earlywarning.common.TextChunker;
import com.earlywarning.regulation.Regulation;
import com.earlywarning.regulation.RegulationRepository;
import com.earlywarning.risk.Risk;
import com.earlywarning.risk.RiskRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final RiskRepository riskRepository;
    private final AlertRepository alertRepository;
    private final RegulationRepository regulationRepository;
    private final UserRepository userRepository;
    private final OpenAiClient openAiClient;
    private final TextChunker textChunker;
    private final AnalysisProgressEmitter progressEmitter;
    private final EntityManager entityManager;

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
    public Contract reanalyze(Long contractId, String userEmail) {
        Contract contract = findByIdAndUserEmail(contractId, userEmail);
        if (contract.getStatus() == Contract.AnalysisStatus.ANALYZING) {
            throw new IllegalStateException("이미 분석 중입니다.");
        }
        riskRepository.deleteByContractId(contract.getId());
        contract.setStatus(Contract.AnalysisStatus.ANALYZING);
        contractRepository.save(contract);
        return contract;
    }

    @Transactional
    public void delete(Long id, String userEmail) {
        Contract contract = findByIdAndUserEmail(id, userEmail);
        alertRepository.deleteByContractId(contract.getId());
        riskRepository.deleteByContractId(contract.getId());
        contractRepository.delete(contract);
        contractRepository.flush();
        resetSequences();
    }

    private void resetSequences() {
        entityManager.createNativeQuery(
                "SELECT setval('contract_id_seq', COALESCE((SELECT MAX(id) FROM contract), 0) + 1, false)"
        ).getSingleResult();
        entityManager.createNativeQuery(
                "SELECT setval('risk_id_seq', COALESCE((SELECT MAX(id) FROM risk), 0) + 1, false)"
        ).getSingleResult();
        entityManager.createNativeQuery(
                "SELECT setval('regulation_alert_id_seq', COALESCE((SELECT MAX(id) FROM regulation_alert), 0) + 1, false)"
        ).getSingleResult();
    }

    public byte[] generateReport(Long contractId, String userEmail) throws IOException {
        Contract contract = findByIdAndUserEmail(contractId, userEmail);
        List<Risk> risks = riskRepository.findByContractIdOrderByLevelAsc(contractId);

        long highCount = risks.stream().filter(r -> r.getLevel() == Risk.RiskLevel.HIGH).count();
        long mediumCount = risks.stream().filter(r -> r.getLevel() == Risk.RiskLevel.MEDIUM).count();
        long lowCount = risks.stream().filter(r -> r.getLevel() == Risk.RiskLevel.LOW).count();

        try (PDDocument doc = new PDDocument()) {
            InputStream fontStream = new ClassPathResource("fonts/NanumGothic.ttf").getInputStream();
            PDFont font = PDType0Font.load(doc, fontStream);

            float margin = 50;
            float pageWidth = PDRectangle.A4.getWidth();
            float usableWidth = pageWidth - 2 * margin;
            float pageHeight = PDRectangle.A4.getHeight();
            float lineHeight = 16;

            float[] yPos = {pageHeight - margin};
            PDPage[] currentPage = {new PDPage(PDRectangle.A4)};
            doc.addPage(currentPage[0]);
            PDPageContentStream[] cs = {new PDPageContentStream(doc, currentPage[0])};

            // Helper: check page break and create new page if needed
            Runnable checkPageBreak = () -> {
                if (yPos[0] < margin + 40) {
                    try {
                        cs[0].close();
                        currentPage[0] = new PDPage(PDRectangle.A4);
                        doc.addPage(currentPage[0]);
                        cs[0] = new PDPageContentStream(doc, currentPage[0]);
                        yPos[0] = pageHeight - margin;
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }
            };

            // Title
            cs[0].beginText();
            cs[0].setFont(font, 20);
            cs[0].newLineAtOffset(margin, yPos[0]);
            cs[0].showText("EarlyWarning 위험 분석 리포트");
            cs[0].endText();
            yPos[0] -= 30;

            // File info
            cs[0].beginText();
            cs[0].setFont(font, 11);
            cs[0].newLineAtOffset(margin, yPos[0]);
            cs[0].showText("파일명: " + contract.getFilename());
            cs[0].endText();
            yPos[0] -= lineHeight;

            cs[0].beginText();
            cs[0].setFont(font, 11);
            cs[0].newLineAtOffset(margin, yPos[0]);
            cs[0].showText("분석일: " + contract.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
            cs[0].endText();
            yPos[0] -= lineHeight * 2;

            // Risk summary
            cs[0].beginText();
            cs[0].setFont(font, 14);
            cs[0].newLineAtOffset(margin, yPos[0]);
            cs[0].showText("위험 요약");
            cs[0].endText();
            yPos[0] -= lineHeight + 4;

            String summary = "HIGH: " + highCount + "건  |  MEDIUM: " + mediumCount + "건  |  LOW: " + lowCount + "건  |  총 " + risks.size() + "건";
            cs[0].beginText();
            cs[0].setFont(font, 11);
            cs[0].newLineAtOffset(margin, yPos[0]);
            cs[0].showText(summary);
            cs[0].endText();
            yPos[0] -= lineHeight * 2;

            // Separator line
            cs[0].moveTo(margin, yPos[0]);
            cs[0].lineTo(pageWidth - margin, yPos[0]);
            cs[0].stroke();
            yPos[0] -= lineHeight;

            // Each risk item
            for (int i = 0; i < risks.size(); i++) {
                Risk risk = risks.get(i);
                checkPageBreak.run();

                // Risk header
                cs[0].beginText();
                cs[0].setFont(font, 12);
                cs[0].newLineAtOffset(margin, yPos[0]);
                cs[0].showText("[" + risk.getLevel().name() + "] 위험 #" + (i + 1));
                cs[0].endText();
                yPos[0] -= lineHeight + 2;

                // Clause
                checkPageBreak.run();
                List<String> clauseLines = wrapText(risk.getClause(), font, 10, usableWidth - 10);
                cs[0].beginText();
                cs[0].setFont(font, 10);
                cs[0].newLineAtOffset(margin + 10, yPos[0]);
                cs[0].showText("조항:");
                cs[0].endText();
                yPos[0] -= lineHeight;

                for (String line : clauseLines) {
                    checkPageBreak.run();
                    cs[0].beginText();
                    cs[0].setFont(font, 10);
                    cs[0].newLineAtOffset(margin + 10, yPos[0]);
                    cs[0].showText(line);
                    cs[0].endText();
                    yPos[0] -= lineHeight;
                }

                // Reason
                checkPageBreak.run();
                cs[0].beginText();
                cs[0].setFont(font, 10);
                cs[0].newLineAtOffset(margin + 10, yPos[0]);
                cs[0].showText("사유:");
                cs[0].endText();
                yPos[0] -= lineHeight;

                List<String> reasonLines = wrapText(risk.getReason(), font, 10, usableWidth - 10);
                for (String line : reasonLines) {
                    checkPageBreak.run();
                    cs[0].beginText();
                    cs[0].setFont(font, 10);
                    cs[0].newLineAtOffset(margin + 10, yPos[0]);
                    cs[0].showText(line);
                    cs[0].endText();
                    yPos[0] -= lineHeight;
                }

                // Suggestion
                if (risk.getSuggestion() != null && !risk.getSuggestion().isBlank()) {
                    checkPageBreak.run();
                    cs[0].beginText();
                    cs[0].setFont(font, 10);
                    cs[0].newLineAtOffset(margin + 10, yPos[0]);
                    cs[0].showText("수정 제안:");
                    cs[0].endText();
                    yPos[0] -= lineHeight;

                    List<String> suggestionLines = wrapText(risk.getSuggestion(), font, 10, usableWidth - 10);
                    for (String line : suggestionLines) {
                        checkPageBreak.run();
                        cs[0].beginText();
                        cs[0].setFont(font, 10);
                        cs[0].newLineAtOffset(margin + 10, yPos[0]);
                        cs[0].showText(line);
                        cs[0].endText();
                        yPos[0] -= lineHeight;
                    }
                }

                yPos[0] -= lineHeight;
            }

            cs[0].close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private List<String> wrapText(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
        List<String> lines = new ArrayList<>();
        if (text == null || text.isBlank()) return lines;

        // Replace newlines with spaces for wrapping
        text = text.replace("\r\n", " ").replace("\n", " ").replace("\r", " ");

        StringBuilder currentLine = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            currentLine.append(text.charAt(i));
            float width = font.getStringWidth(currentLine.toString()) / 1000 * fontSize;
            if (width > maxWidth) {
                // Remove last char, push line, start new
                String line = currentLine.substring(0, currentLine.length() - 1);
                if (line.isEmpty()) {
                    // Single char exceeds width, force it
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder();
                } else {
                    lines.add(line);
                    currentLine = new StringBuilder();
                    currentLine.append(text.charAt(i));
                }
            }
        }
        if (!currentLine.isEmpty()) {
            lines.add(currentLine.toString());
        }
        return lines;
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
