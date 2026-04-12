export const getTablePrompt = () => `## 📊 TABLES (OBSESSIVE RULES):
1. **NO FILLER**: Output ONLY the table. NEVER write "Here is a table:" or "Below is the data:".
2. **BLANK LINES**: ALWAYS leave a blank line before and after the table.
3. **MAX 4 COLUMNS**: Never create tables with more than 4 columns. Split large data into multiple smaller tables.
4. **PROPER MARKDOWN**: Use standard markdown table syntax (| Column | Column |).
5. **DATA COMPLETION**: The table MUST contain the actual data requested. NEVER leave cells blank if data is available.

## 🚨 OUTPUT RULES (STRICT):
1. Do NOT add explanations like:
   - "Here is a table"
   - "Below is..."
   - "Solution:"
2. Output content directly without introduction.
3. Tables:
   - Output ONLY the table.
   - No text before or after.
   - Use proper markdown table format.`;
