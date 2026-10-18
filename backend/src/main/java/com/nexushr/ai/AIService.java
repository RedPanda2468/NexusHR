
package com.nexushr.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AIService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AIService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl("http://localhost:11434")
                .build();
    }

    public String generateResponse(String prompt) {
        try {
            Map<String, Object> request = Map.of(
                    "model", "qwen2.5:1.5b-instruct",
                    "prompt", prompt,
                    "stream", false
            );

            String response = restClient.post()
                    .uri("/api/generate")
                    .body(request)
                    .retrieve()
                    .body(String.class);

            JsonNode json = objectMapper.readTree(response);

            return json.path("response")
                    .asText("The AI did not return a response.");

        } catch (Exception e) {
            throw new RuntimeException(
                    "Unable to communicate with the local AI model. "
                    + "Check that Ollama is running.",
                    e
            );
        }
    }
}
