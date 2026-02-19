package com.example.emailai.service;

import com.example.emailai.dto.EmailGenerateRequest;
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
public class EmailGeneratorService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model:llama3-70b-8192}")
    private String model;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://generativelanguage.googleapis.com")
            .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .build();

    public Mono<String> generateEmail(EmailGenerateRequest request) {

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

    private String buildPrompt(EmailGenerateRequest request) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("""
                You are an assistant that writes natural, human-like email replies.
                
                Read the email below and write a reply that:
                - Matches the emotional tone of the email
                - Does NOT use placeholders like [Name], [Date], [Action Step]
                - Sounds like a real person replying
                - Is friendly, warm, or emotional if the email is personal
                - Is professional ONLY if the email is professional
                - Email should be proper in formate
                
                Email:
                {{emailContent}}
                
            """).append(request.getPurpose());

        if (request.getTone() != null) {
            prompt.append("\nTone: ").append(request.getTone());
        }

        return prompt.toString();
    }
}
