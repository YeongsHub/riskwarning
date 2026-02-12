package com.earlywarning;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EarlyWarningApplication {

    public static void main(String[] args) {
        SpringApplication.run(EarlyWarningApplication.class, args);
    }
}
