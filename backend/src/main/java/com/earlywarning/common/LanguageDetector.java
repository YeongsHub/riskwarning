package com.earlywarning.common;

public class LanguageDetector {

    /**
     * Detects language from text content.
     * Returns "ko" if Korean characters exceed 30% of alphanumeric+Korean chars, otherwise "en".
     */
    public static String detect(String text) {
        if (text == null || text.isBlank()) return "ko";

        int koreanCount = 0;
        int totalCount = 0;

        for (char c : text.toCharArray()) {
            if (c >= '\uAC00' && c <= '\uD7AF') {
                koreanCount++;
                totalCount++;
            } else if (Character.isLetterOrDigit(c)) {
                totalCount++;
            }
        }

        if (totalCount == 0) return "ko";
        return ((double) koreanCount / totalCount) > 0.3 ? "ko" : "en";
    }
}
