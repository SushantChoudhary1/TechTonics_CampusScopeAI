# Student light-theme verification

The root cause was duplicate theme state: StudentShell stored `campusscope-theme` locally and toggled `mode-light`, while ThemeProvider owned the actual `data-theme` state. The student shell now uses `useTheme()`, and ThemeProvider reads and writes both the primary and legacy preference keys.

Post-fix browser verification on `/student` after setting both stored theme keys to `light` showed a light background and white card with dark readable heading text. The protected route displayed its expected sign-in fallback because no temporary student account remains. The full suite passed with 37 tests, TypeScript passed, and the production build passed.
