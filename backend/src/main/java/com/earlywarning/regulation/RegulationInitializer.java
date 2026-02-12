package com.earlywarning.regulation;

import com.earlywarning.common.OpenAiClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RegulationInitializer implements CommandLineRunner {

    private final RegulationRepository regulationRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) {
        try {
            List<String> existingNames = regulationRepository.findAll().stream()
                    .map(Regulation::getName).toList();

            log.info("Existing regulations: {} records", existingNames.size());
            log.info("Loading regulations from JSON...");
            ClassPathResource resource = new ClassPathResource("data/regulations.json");

            int loaded = 0;
            try (InputStream is = resource.getInputStream()) {
                List<RegulationDto> regulations = objectMapper.readValue(
                        is, new TypeReference<List<RegulationDto>>() {}
                );

                for (RegulationDto dto : regulations) {
                    if (existingNames.contains(dto.name())) {
                        log.debug("Skipping existing regulation: {}", dto.name());
                        continue;
                    }

                    Regulation regulation = new Regulation();
                    regulation.setName(dto.name());
                    regulation.setDescription(dto.description());

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
                log.info("Regulations initialization complete: {} new loaded, {} total",
                        loaded, regulationRepository.count());
            }
        } catch (Exception e) {
            log.warn("Could not initialize regulations. Vector extension may not be available: {}", e.getMessage());
        }
    }

    record RegulationDto(String name, String category, String description, List<String> riskKeywords) {}
}
