# Project Guidelines & Agent Rules

## API Quota Preservation
- **DO NOT test live AI models or Gemini APIs during testing and verification.**
- Never run scripts or tests that invoke `client.models.generate_content`, `client.models.embed_content`, or any live LLM API endpoints.
- Preserve all API requests strictly for the user.
- To verify changes:
  - Test logic with unit tests, offline mock responses, or heuristic checks.
  - Test imports and code syntax with `py_compile` or static analysis.
  - Rely on user-driven manual verification in the UI for live model responses.
