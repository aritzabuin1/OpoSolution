# ADR-0003: PROMPT_VERSION Strategy for Test Generation

## Status

Accepted

## Context

OpoRuta generates tests using AI (OpenAI GPT for MCQ, Claude for corrections). The quality of generated tests depends directly on the prompts used. When prompts change:

1. Test quality may improve or regress
2. Previously generated tests were created under different rules
3. AI evaluation benchmarks need to be compared against specific prompt versions
4. If a prompt change causes quality regression, we need to know which tests were affected and roll back

We needed a way to:
- Track which prompt version produced each test
- Compare test quality across prompt iterations
- Enable rollback to a known-good prompt if a new version regresses
- Correlate evaluation results with prompt changes

## Decision

We implemented an explicit `PROMPT_VERSION` constant in each AI module:

```typescript
// lib/ai/generate-test.ts
export const PROMPT_VERSION = '2.1.0'

// lib/ai/correct-desarrollo.ts
export const PROMPT_VERSION = '1.8.0'
```

### Versioning Rules

- **Major bump** (X.0.0): Fundamental change to the pipeline (e.g., adding Bloque II support, switching AI provider)
- **Minor bump** (x.Y.0): Significant prompt change (e.g., adding INAP examples, changing verification logic)
- **Patch bump** (x.y.Z): Minor prompt tweaks (e.g., wording adjustments, formatting changes)

### Storage

Every generated test record in `tests_generados` includes a `prompt_version` column:

```sql
prompt_version text NOT NULL  -- e.g., '2.1.0', 'psico-1.0', 'oficial-1.0'
```

Special prompt versions:
- `'psico-1.0'` -- deterministic psychometric engine (no AI)
- `'oficial-1.0'` -- simulacro from official exam questions (no AI)
- `'oficial-psico-1.0'` -- simulacro with psychometric section
- `'repaso-1.0'` -- error review test (no AI)

### Hardcoded Test Assertions

Unit tests in `tests/unit/generate-test.test.ts` hardcode the expected `PROMPT_VERSION` value. When bumping the version:

1. Update the constant in the source file
2. Update the hardcoded value in the test file

This intentional friction ensures the developer is aware they are changing the prompt version and has reviewed the implications.

### Version History

| Version | Module | Change |
|---------|--------|--------|
| 1.0.0 | generate-test | Initial MCQ pipeline |
| 2.0.0 | generate-test | Bloque II support (ofimatica), optional `cita` |
| 2.1.0 | generate-test | INAP examples via `retrieveExamples()` in Bloque I prompt |
| 1.0.0 | correct-desarrollo | Initial correction pipeline |
| 1.8.0 | correct-desarrollo | Current correction prompt |

## Consequences

### Positive

- **Reproducibility**: Given a `prompt_version`, we know exactly which prompt logic generated a test
- **A/B comparison**: Evaluation runner (`pnpm eval:all`) can compare quality metrics across versions
- **Safe rollback**: If version 2.1.0 regresses, revert the constant to 2.0.0 and the system immediately uses the old prompt
- **Audit trail**: Every test in the database records which prompt version created it
- **Golden dataset correlation**: Evaluation protocols reference specific prompt versions

### Negative

- **Manual process**: Requires developer discipline to bump the version and update tests
- **No automatic rollback**: A quality regression is detected by evals, but the rollback is manual
- **Single version per deployment**: All users get the same prompt version (no gradual rollout or canary deployment)

### Future Considerations

- Consider automated evaluation on CI/CD that blocks deployment if quality metrics drop below a threshold
- Consider A/B testing infrastructure to serve different prompt versions to different users
- Consider storing the full prompt text (not just the version) for complete reproducibility
