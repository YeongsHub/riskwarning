package com.earlywarning.risk;

import com.earlywarning.contract.Contract;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "risk")
@Getter @Setter
@NoArgsConstructor
public class Risk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @Column(columnDefinition = "TEXT")
    private String clause;

    @Enumerated(EnumType.STRING)
    private RiskLevel level;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String suggestion;

    public enum RiskLevel {
        HIGH, MEDIUM, LOW
    }
}