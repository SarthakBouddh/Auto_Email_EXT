package com.example.emailai.dto;

import lombok.Data;

@Data
public class EmailReplyRequest {
    String emailContent;
    String tone;
}
