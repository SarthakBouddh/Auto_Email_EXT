package com.example.emailai.service;

import com.example.emailai.dto.EmailReplyRequest;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class EmailReplyService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://generativelanguage.googleapis.com")
            .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .build();

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model:llama3-70b-8192}")
    private String model;

    public Mono<String> replyEmail(EmailReplyRequest request) {

        String prompt = buildPrompt(request);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "temperature", 0,
                "messages", List.of(
                        Map.of("role", "user", "content", prompt)
                )
        );

        return webClient.post()
                .uri(groqApiUrl)
                .header("Authorization", "Bearer " + groqApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .map(this::extractResponseContent);
    }

    private String extractResponseContent(String response) {
        try {
            JsonNode root = MAPPER.readTree(response);

            return root.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

        } catch (Exception e) {
            return "Error parsing Groq response: " + e.getMessage();
        }
    }

    private String buildPrompt(EmailReplyRequest request) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("Generate a professional email reply. Do not include a subject line.");
        if (request.getTone() != null && !request.getTone().isEmpty()) {
            prompt.append(" Use a ")
                    .append(request.getTone())
                    .append(" tone.");
        }
        prompt.append("\n\nOriginal email:\n") .append(request.getEmailContent());

        return prompt.toString();
    }
}
