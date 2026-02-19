package com.example.emailai.controller;

import com.example.emailai.dto.EmailGenerateRequest;
import com.example.emailai.dto.EmailReplyRequest;
import com.example.emailai.service.EmailGeneratorService;
import com.example.emailai.service.EmailReplyService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@AllArgsConstructor
@RequestMapping("/api/email")
public class EmailGeneratorController {

    private final EmailGeneratorService emailGeneratorService;
    private final EmailReplyService emailReplyService;

    @PostMapping("/reply")
    public Mono<String> ReplyEmail(@RequestBody EmailReplyRequest emailRequest) {
        return emailReplyService.replyEmail(emailRequest);
    }

    @PostMapping("/generate")
    public Mono<String> generateEmail(@RequestBody EmailGenerateRequest emailRequest) {
        return emailGeneratorService.generateEmail(emailRequest);
    }
}
