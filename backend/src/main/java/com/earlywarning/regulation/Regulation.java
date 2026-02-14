package com.earlywarning.regulation;

import com.earlywarning.common.VectorType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "regulation")
@Getter @Setter
@NoArgsConstructor
public class Regulation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Type(VectorType.class)
    @Column(columnDefinition = "vector(1536)")
    private float[] embedding;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "content_hash")
    private String contentHash;

    private String category;
}