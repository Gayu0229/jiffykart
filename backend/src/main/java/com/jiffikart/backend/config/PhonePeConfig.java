package com.jiffikart.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "phonepe")
@Data
public class PhonePeConfig {
    private String merchantId;
    private String saltKey;
    private String saltIndex;
    private String clientId;
    private String clientSecret;
    private String clientVersion;
    private String tokenUrl;
    private String apiUrl;
    private String statusUrl;
    private String redirectUrl;
    private String callbackUrl;
}
