package com.earlywarning.regulation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RegulationRepository extends JpaRepository<Regulation, Long> {

    @Query(value = """
        SELECT * FROM regulation
        WHERE embedding <=> CAST(:embedding AS vector) < :threshold
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT 3
        """, nativeQuery = true)
    List<Regulation> findSimilar(@Param("embedding") String embedding,
                                  @Param("threshold") double threshold);
}