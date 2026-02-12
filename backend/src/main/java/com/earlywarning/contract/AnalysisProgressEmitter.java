package com.earlywarning.contract;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class AnalysisProgressEmitter {

    private final ConcurrentHashMap<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter create(Long contractId) {
        SseEmitter emitter = new SseEmitter(300_000L); // 5 min timeout
        emitters.put(contractId, emitter);

        emitter.onCompletion(() -> emitters.remove(contractId));
        emitter.onTimeout(() -> emitters.remove(contractId));
        emitter.onError(e -> emitters.remove(contractId));

        return emitter;
    }

    public void send(Long contractId, String step, String message, int current, int total) {
        SseEmitter emitter = emitters.get(contractId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("progress")
                        .data(Map.of(
                                "step", step,
                                "message", message,
                                "current", current,
                                "total", total
                        )));
            } catch (IOException e) {
                log.warn("Failed to send SSE for contract {}: {}", contractId, e.getMessage());
                emitters.remove(contractId);
            }
        }
    }

    public void complete(Long contractId) {
        SseEmitter emitter = emitters.get(contractId);
        if (emitter != null) {
            try {
                emitter.complete();
            } catch (Exception e) {
                log.warn("Failed to complete SSE for contract {}: {}", contractId, e.getMessage());
            }
            emitters.remove(contractId);
        }
    }
}
