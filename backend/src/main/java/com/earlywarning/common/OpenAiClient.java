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
                다음 계약서 텍스트에서 법적 위험이 있는 부분을 분석하세요:

                텍스트: "%s"

                관련 규제: %s

                규칙:
                1. "clause"에는 위험한 핵심 문장만 원문 그대로 추출하세요 (텍스트에서 복사, 번역하지 말 것)
                2. "reason"은 한국어로 위반 규제명과 위험 사유를 간결하게 설명하세요
                3. "suggestion"은 해당 조항을 법적으로 안전하게 수정한 대체 문구를 한국어로 제시하세요. 원문과 같은 어투를 유지하되 위험 요소를 제거하세요
                4. 위험이 없으면 level을 "NONE"으로 하세요

                다음 JSON 형식으로 응답하세요:
                {"clause": "원문에서 추출한 위험 문장", "level": "HIGH|MEDIUM|LOW|NONE", "reason": "한국어 설명", "suggestion": "수정 제안 문구"}
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

            String suggestion = result.has("suggestion") && !result.get("suggestion").isNull()
                    ? result.get("suggestion").asText() : null;

            return new RiskAnalysis(
                    result.get("clause").asText(),
                    result.get("level").asText(),
                    result.get("reason").asText(),
                    suggestion
            );
        }
    }

    public record RiskAnalysis(String clause, String level, String reason, String suggestion) {}
}