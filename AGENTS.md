# AGENTS.md — Development Rules for Si Vc

## Core Principles & Development Guidelines

1. **Adapt Reasoning & Planning to Task Complexity**: Scale analysis and preparation to match the scope of the request.
2. **Simple Changes**: Act immediately without extensive planning. Inspect only relevant files, make minimal necessary changes, and run targeted checks.
3. **Medium-Complexity Tasks**: Perform a brief analysis and proceed directly to implementation.
4. **Complex Tasks**: For work involving architecture, authentication, databases, payments, infrastructure, or security, prepare a clear, structured plan before implementation.
5. **Context & Tool Efficiency**: Avoid unnecessary repository-wide scans, redundant tool calls, repeated file reading, and excessive documentation.
6. **Subagent Usage**: Do not invoke subagents unless genuinely beneficial for the task.
7. **Execution Speed & Context Economy**: Prioritize swift execution and efficient context usage without compromising code quality.
8. **Code Quality & Stability**: Preserve existing functionality and follow professional, production-grade development standards.
9. **Safety Guardrails**: Never deploy to production or perform destructive operations without explicit user approval.
10. **Communication Language & Style**: Communicate with the user in Polish, using simple language and concise explanations.

## Domain & Creative Guidelines
- **Product Fidelity ("Produkt jest święty")**: Garment, cut, colors, prints, and texture from reference packshots (PSH) must remain accurate and faithful.
- **AI Prompts**: Always generate prompts in English, formatted in clean ready-to-copy blocks, with clear aspect ratios (e.g. 9:16 vertical, 3:4), lighting and camera details.
- **Production Workflows**: Maintain robust batch queues, CSV ingestion (MDK, AI instructions), and side-by-side review standards.
