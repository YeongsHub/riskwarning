package com.earlywarning.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class OpenAiClient {

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.embedding-model}")
    private String embeddingModel;

    @Value("${openai.chat-model}")
    private String chatModel;

    public float[] createEmbedding(String text) throws IOException {
        Map<String, Object> body = Map.of(
                "model", embeddingModel,
                "input", text
        );

        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/embeddings")
                .header("Authorization", "Bearer " + apiKey)
                .post(RequestBody.create(
                        mapper.writeValueAsString(body),
                        MediaType.parse("application/json")
                ))
                .build();

        try (Response response = client.newCall(request).execute()) {
            JsonNode json = mapper.readTree(response.body().string());
            JsonNode embeddingNode = json.get("data").get(0).get("embedding");

            float[] embedding = new float[embeddingNode.size()];
            for (int i = 0; i < embeddingNode.size(); i++) {
                embedding[i] = embeddingNode.get(i).floatValue();
            }
            return embedding;
        }
    }

    public RiskAnalysis analyzeRisk(String clause, List<String> regulations) throws IOException {
        String prompt = """
                Analyze this contract clause for legal risks:

                Clause: "%s"

                Related regulations: %s

                Respond in JSON format:
                {"level": "HIGH|MEDIUM|LOW", "reason": "brief explanation with regulation reference"}
                """.formatted(clause, String.join(", ", regulations));

        Map<String, Object> body = Map.of(
                "model", chatModel,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "response_format", Map.of("type", "json_object")
        );

        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .post(RequestBody.create(
                        mapper.writeValueAsString(body),
                        MediaType.parse("application/json")
                ))
                .build();

        try (Response response = client.newCall(request).execute()) {
            JsonNode json = mapper.readTree(response.body().string());
            String content = json.get("choices").get(0).get("message").get("content").asText();
            JsonNode result = mapper.readTree(content);

            return new RiskAnalysis(
                    result.get("level").asText(),
                    result.get("reason").asText()
            );
        }
    }

    public record RiskAnalysis(String level, String reason) {}
}