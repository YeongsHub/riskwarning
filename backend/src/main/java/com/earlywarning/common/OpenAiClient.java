package com.earlywarning.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class OpenAiClient {

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();
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

    public RiskAnalysis analyzeRisk(String clause, List<String> regulations, String language) throws IOException {
        String prompt;
        if ("en".equals(language)) {
            prompt = """
                    Analyze the following contract text for legal risks:

                    Text: "%s"

                    Related regulations: %s

                    Risk level criteria:
                    - HIGH: Clear legal violation, or clauses that could render the contract void/voidable (e.g., violation of mandatory rules, deprivation of consumer rights, unfair terms)
                    - MEDIUM: Potential legal disputes but may be valid depending on interpretation (e.g., ambiguous liability limitations, unclear termination conditions, excessive penalties)
                    - LOW: Minor legal risks or improvement recommendations (e.g., insufficient notice period, unspecified jurisdiction, minor terminology inconsistencies)
                    - NONE: Matched with regulations but no actual legal risk

                    Rules:
                    1. "clause" must contain only the risky key sentence extracted verbatim from the text (copy from text, do not translate)
                    2. "reason" should concisely explain the violated regulation and risk reason in English
                    3. "suggestion" should provide an alternative clause that is legally safe, in English. Maintain the same tone as the original but remove risk elements
                    4. If there is no risk, set level to "NONE"
                    5. Judge risk levels carefully. Do not classify all risks as HIGH.

                    Respond in the following JSON format:
                    {"clause": "risky sentence extracted from text", "level": "HIGH|MEDIUM|LOW|NONE", "reason": "English explanation", "suggestion": "suggested revision"}
                    """.formatted(clause, String.join(", ", regulations));
        } else {
            prompt = """
                    다음 계약서 텍스트에서 법적 위험이 있는 부분을 분석하세요:

                    텍스트: "%s"

                    관련 규제: %s

                    위험 수준 판단 기준:
                    - HIGH: 법률 위반이 명백하거나, 계약 무효/취소 사유가 될 수 있는 조항 (예: 강행규정 위반, 소비자 권리 박탈, 불공정 약관)
                    - MEDIUM: 법적 분쟁 가능성이 있으나 해석에 따라 유효할 수 있는 조항 (예: 모호한 책임 제한, 불명확한 해지 조건, 과도한 위약금)
                    - LOW: 법적 위험이 경미하거나 개선 권고 수준인 조항 (예: 통지 기간 부족, 관할법원 미지정, 사소한 용어 불일치)
                    - NONE: 관련 규제와 매칭되었으나 실제 법적 위험이 없는 경우

                    규칙:
                    1. "clause"에는 위험한 핵심 문장만 원문 그대로 추출하세요 (텍스트에서 복사, 번역하지 말 것)
                    2. "reason"은 한국어로 위반 규제명과 위험 사유를 간결하게 설명하세요
                    3. "suggestion"은 해당 조항을 법적으로 안전하게 수정한 대체 문구를 한국어로 제시하세요. 원문과 같은 어투를 유지하되 위험 요소를 제거하세요
                    4. 위험이 없으면 level을 "NONE"으로 하세요
                    5. 위험 수준을 신중하게 판단하세요. 모든 위험을 HIGH로 분류하지 마세요.

                    다음 JSON 형식으로 응답하세요:
                    {"clause": "원문에서 추출한 위험 문장", "level": "HIGH|MEDIUM|LOW|NONE", "reason": "한국어 설명", "suggestion": "수정 제안 문구"}
                    """.formatted(clause, String.join(", ", regulations));
        }

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

    public NegotiationGuide generateNegotiationGuide(String clause, String level, String reason, String suggestion, String language) throws IOException {
        String prompt;
        if ("en".equals(language)) {
            prompt = """
                    Generate a negotiation guide for the following contract clause:

                    Clause: "%s"
                    Risk level: %s
                    Risk reason: %s
                    Suggested revision: %s

                    Analyze negotiation points from both Party A (contract provider) and Party B (contract recipient) perspectives.

                    Respond in the following JSON format:
                    {
                      "gap_perspective": {
                        "summary": "Party A perspective summary (1-2 sentences)",
                        "negotiation_points": ["point 1", "point 2", "point 3"]
                      },
                      "eul_perspective": {
                        "summary": "Party B perspective summary (1-2 sentences)",
                        "negotiation_points": ["point 1", "point 2", "point 3"]
                      },
                      "alternative_clauses": ["alternative clause 1", "alternative clause 2"],
                      "risk_if_unchanged": "Specific risk description if this clause is not modified"
                    }
                    """.formatted(clause, level, reason, suggestion != null ? suggestion : "None");
        } else {
            prompt = """
                    다음 계약 조항에 대해 협상 가이드를 생성하세요:

                    조항: "%s"
                    위험 수준: %s
                    위험 사유: %s
                    수정 제안: %s

                    갑(계약 제공자)과 을(계약 수령자) 양쪽 관점에서 협상 포인트를 분석하세요.

                    다음 JSON 형식으로 응답하세요:
                    {
                      "gap_perspective": {
                        "summary": "갑 관점 요약 (1-2문장)",
                        "negotiation_points": ["협상 포인트1", "협상 포인트2", "협상 포인트3"]
                      },
                      "eul_perspective": {
                        "summary": "을 관점 요약 (1-2문장)",
                        "negotiation_points": ["협상 포인트1", "협상 포인트2", "협상 포인트3"]
                      },
                      "alternative_clauses": ["대안 조항1", "대안 조항2"],
                      "risk_if_unchanged": "이 조항을 수정하지 않을 경우 발생할 수 있는 구체적 위험 설명"
                    }
                    """.formatted(clause, level, reason, suggestion != null ? suggestion : "없음");
        }

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

            Perspective gapPerspective = parsePerspective(result.get("gap_perspective"));
            Perspective eulPerspective = parsePerspective(result.get("eul_perspective"));

            List<String> alternativeClauses = new java.util.ArrayList<>();
            if (result.has("alternative_clauses")) {
                for (JsonNode node : result.get("alternative_clauses")) {
                    alternativeClauses.add(node.asText());
                }
            }

            String riskIfUnchanged = result.has("risk_if_unchanged") ? result.get("risk_if_unchanged").asText() : "";

            return new NegotiationGuide(gapPerspective, eulPerspective, alternativeClauses, riskIfUnchanged);
        }
    }

    private Perspective parsePerspective(JsonNode node) {
        String summary = node.has("summary") ? node.get("summary").asText() : "";
        List<String> points = new java.util.ArrayList<>();
        if (node.has("negotiation_points")) {
            for (JsonNode p : node.get("negotiation_points")) {
                points.add(p.asText());
            }
        }
        return new Perspective(summary, points);
    }

    public record NegotiationGuide(Perspective gapPerspective, Perspective eulPerspective,
                                    List<String> alternativeClauses, String riskIfUnchanged) {}
    public record Perspective(String summary, List<String> negotiationPoints) {}
}