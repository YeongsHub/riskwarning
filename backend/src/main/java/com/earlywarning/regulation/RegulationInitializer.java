package com.earlywarning.regulation;

import com.earlywarning.alert.AlertService;
import com.earlywarning.common.OpenAiClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class RegulationInitializer implements CommandLineRunner {

    private final RegulationRepository regulationRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;
    private final AlertService alertService;

    @Override
    public void run(String... args) {
        try {
            Map<String, Regulation> existingByName = regulationRepository.findAll().stream()
                    .collect(Collectors.toMap(Regulation::getName, r -> r, (a, b) -> a));

            log.info("Existing regulations: {} records", existingByName.size());
            log.info("Loading regulations from JSON...");
            ClassPathResource resource = new ClassPathResource("data/regulations.json");

            int loaded = 0;
            int updated = 0;
            try (InputStream is = resource.getInputStream()) {
                List<RegulationDto> regulations = objectMapper.readValue(
                        is, new TypeReference<List<RegulationDto>>() {}
                );

                for (RegulationDto dto : regulations) {
                    String contentHash = computeHash(dto.name() + dto.description() + String.join(",", dto.riskKeywords()));

                    Regulation existing = existingByName.get(dto.name());
                    if (existing != null) {
                        // Always update category and relatedCases
                        existing.setCategory(dto.category());

                        // Check if content has changed via hash
                        if (contentHash.equals(existing.getContentHash())) {
                            regulationRepository.save(existing);
                            log.debug("Skipping unchanged regulation: {}", dto.name());
                            continue;
                        }

                        // Content changed — update regulation
                        log.info("Updating changed regulation: {}", dto.name());
                        existing.setDescription(dto.description());
                        existing.setContentHash(contentHash);
                        existing.setUpdatedAt(LocalDateTime.now());

                        try {
                            String textForEmbedding = dto.name() + ": " + dto.description() +
                                    " Risk keywords: " + String.join(", ", dto.riskKeywords());
                            float[] embedding = openAiClient.createEmbedding(textForEmbedding);
                            existing.setEmbedding(embedding);
                            regulationRepository.save(existing);
                            updated++;

                            // Create alerts for affected contracts
                            alertService.createAlertsForUpdatedRegulation(existing);
                        } catch (Exception e) {
                            log.error("Failed to update regulation: {}", dto.name(), e);
                        }
                        continue;
                    }

                    // New regulation
                    Regulation regulation = new Regulation();
                    regulation.setName(dto.name());
                    regulation.setDescription(dto.description());
                    regulation.setContentHash(contentHash);
                    regulation.setCategory(dto.category());

                    try {
                        String textForEmbedding = dto.name() + ": " + dto.description() +
                                " Risk keywords: " + String.join(", ", dto.riskKeywords());
                        float[] embedding = openAiClient.createEmbedding(textForEmbedding);
                        regulation.setEmbedding(embedding);
                        regulationRepository.save(regulation);
                        loaded++;
                        log.info("Loaded: {}", dto.name());
                    } catch (Exception e) {
                        log.error("Failed to load regulation: {}", dto.name(), e);
                    }
                }
                log.info("Regulations initialization complete: {} new loaded, {} updated, {} total",
                        loaded, updated, regulationRepository.count());
            }
        } catch (Exception e) {
            log.warn("Could not initialize regulations. Vector extension may not be available: {}", e.getMessage());
        }
    }

    private String computeHash(String content) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(content.getBytes());
            return new BigInteger(1, digest).toString(16);
        } catch (Exception e) {
            return String.valueOf(content.hashCode());
        }
    }

    record RegulationDto(String name, String category, String description, List<String> riskKeywords) {}
}
