package com.earlywarning.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TextChunker {

    @Value("${risk.chunk-size}")
    private int chunkSize;

    // Korean: 제1조, 제2조 ... / English: Section 1, Article 1, ARTICLE I, 1. TITLE
    private static final Pattern CLAUSE_PATTERN = Pattern.compile(
            "(?m)^\\s*(?:제\\s*\\d+\\s*조|(?:Section|Article|SECTION|ARTICLE)\\s+[\\dIVXivx]+|\\d+\\.\\s+[A-Z\\uAC00-\\uD7A3])"
    );

    public List<String> chunk(String text) {
        List<String> clauseChunks = splitByClauses(text);
        if (clauseChunks.size() > 1) {
            return refineClauses(clauseChunks);
        }
        // Fallback: sentence-based chunking for unstructured text
        return chunkBySentence(text);
    }

    private List<String> splitByClauses(String text) {
        List<String> clauses = new ArrayList<>();
        Matcher matcher = CLAUSE_PATTERN.matcher(text);

        List<Integer> positions = new ArrayList<>();
        while (matcher.find()) {
            positions.add(matcher.start());
        }

        if (positions.isEmpty()) {
            return clauses;
        }

        // Text before the first clause (title, preamble)
        String preamble = text.substring(0, positions.get(0)).trim();
        if (!preamble.isEmpty()) {
            clauses.add(preamble);
        }

        for (int i = 0; i < positions.size(); i++) {
            int start = positions.get(i);
            int end = (i + 1 < positions.size()) ? positions.get(i + 1) : text.length();
            String clause = text.substring(start, end).trim();
            if (!clause.isEmpty()) {
                clauses.add(clause);
            }
        }

        return clauses;
    }

    /**
     * If a clause exceeds chunkSize, split it further by sub-items (1. 2. 3.)
     * If a clause is very short, merge it with the next one.
     */
    private List<String> refineClauses(List<String> clauses) {
        List<String> result = new ArrayList<>();

        for (String clause : clauses) {
            if (clause.length() <= chunkSize) {
                result.add(clause);
            } else {
                // Split long clauses by numbered sub-items
                result.addAll(splitLongClause(clause));
            }
        }

        // Merge very short consecutive chunks (< 100 chars)
        List<String> merged = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String chunk : result) {
            if (current.length() > 0 && current.length() + chunk.length() > chunkSize) {
                merged.add(current.toString().trim());
                current = new StringBuilder();
            }
            if (current.length() > 0) {
                current.append("\n");
            }
            current.append(chunk);
        }
        if (current.length() > 0) {
            merged.add(current.toString().trim());
        }

        return merged;
    }

    private List<String> splitLongClause(String clause) {
        List<String> parts = new ArrayList<>();

        // Extract the heading line (제N조 ... or Section N ...)
        int firstNewline = clause.indexOf('\n');
        String heading = (firstNewline > 0) ? clause.substring(0, firstNewline).trim() : "";
        String body = (firstNewline > 0) ? clause.substring(firstNewline).trim() : clause;

        // Split body by numbered items: "1." "2." etc at line start
        Pattern subItemPattern = Pattern.compile("(?m)^\\s*\\d+\\.");
        Matcher m = subItemPattern.matcher(body);

        List<Integer> subPositions = new ArrayList<>();
        while (m.find()) {
            subPositions.add(m.start());
        }

        if (subPositions.size() <= 1) {
            // Can't split further, use sentence-based fallback
            return chunkBySentence(clause);
        }

        for (int i = 0; i < subPositions.size(); i++) {
            int start = subPositions.get(i);
            int end = (i + 1 < subPositions.size()) ? subPositions.get(i + 1) : body.length();
            String subItem = body.substring(start, end).trim();
            // Prepend heading so GPT knows the context
            parts.add(heading + "\n" + subItem);
        }

        return parts;
    }

    private List<String> chunkBySentence(String text) {
        List<String> chunks = new ArrayList<>();
        String[] sentences = text.split("(?<=[.!?。])\\s+");

        StringBuilder current = new StringBuilder();
        for (String sentence : sentences) {
            if (current.length() + sentence.length() > chunkSize && !current.isEmpty()) {
                chunks.add(current.toString().trim());
                current = new StringBuilder();
            }
            current.append(sentence).append(" ");
        }

        if (!current.isEmpty()) {
            chunks.add(current.toString().trim());
        }

        return chunks;
    }
}
