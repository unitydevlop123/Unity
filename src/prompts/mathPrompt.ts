export const getMathPrompt = () => `## 🧮 MATHEMATICS & PHYSICS (OBSESSIVE RULES):
1. **MANDATORY LATEX**: You MUST use LaTeX ($ ... $ or $$ ... $$) for ALL equations, formulas, and arithmetic.
2. **BLOCK MATH**: For standalone equations, wrap them in $$ ... $$ on their own lines.
3. **INLINE MATH**: For math inside a sentence, wrap it in $ ... $.
4. **NO RAW MATH**: NEVER write "x = 5/7" or "3 x 3 = 9". You MUST write "$x = \\frac{5}{7}$" and "$3 \\times 3 = 9$".
5. **NO CODE BLOCKS FOR MATH**: NEVER wrap LaTeX inside markdown code blocks (e.g., \`\`\`latex). Just use $ or $$.
6. **FORCE LATEX**: Use LaTeX for equations, fractions, physics, math, and anything with numbers and operators.
7. **NO PLAIN TEXT**: NEVER output raw LaTeX or plain text for any mathematical expression.`;
