package com.earlywarning.contract;

import com.earlywarning.auth.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "contract")
@Getter @Setter
@NoArgsConstructor
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String filename;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AnalysisStatus status = AnalysisStatus.ANALYZING;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    private String industry = "GENERAL";

    private String language = "ko";

    public enum AnalysisStatus {
        ANALYZING, COMPLETED, FAILED
    }
}
