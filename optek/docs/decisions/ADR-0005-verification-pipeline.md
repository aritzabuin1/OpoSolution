# ADR-0005: Deterministic Citation Verification Pipeline

## Status

Accepted

## Context

OpoRuta generates multiple-choice test questions about Spanish legislation using AI (OpenAI GPT). A critical requirement is that **no legal hallucination reaches the user**. If the AI claims "Article 53 of the LPAC establishes a 15-day deadline" but the real article says "10 days", the student learns incorrect law and may fail their exam.

AI language models are probabilistic and can:
- Invent article numbers that do not exist
- Cite the wrong law for a given article
- Fabricate deadlines, institutional names, or procedural details
- Mix content from different articles

We needed a verification layer that is **100% deterministic** -- no AI involved in verification -- and that checks every legal citation against the actual legislation stored in our database.

## Decision

We implemented a multi-stage deterministic verification pipeline in `lib/ai/verification.ts`:

### Stage 1: Citation Extraction (`extractCitations`)

Uses regex multi-pattern matching to extract legal citations from generated text. Supported formats:

- `articulo 14 CE`
- `art. 53.1 LPAC`
- `Art. 53.1.a de la Ley 39/2015`
- `articulo 14 de la Constitucion`
- `articulo 9 bis de la LPAC`

The extractor produces `ExtractedCitation` objects with the law name resolved to a canonical code (e.g., "Constitucion Espanola" -> "CE") via `resolveLeyNombre()` from `citation-aliases.ts`.

### Stage 2: Citation Verification (`verifyCitation`)

Each extracted citation is looked up in the `legislacion` table by `ley_nombre` + `articulo_numero`:

1. **Exact match**: Direct lookup by law name and article number
2. **Variant retry**: If exact match fails, try cleaned variants (e.g., "53.1" -> "53", "9 bis" -> "9bis")
3. **Result**: Returns `verificada: true` with the `texto_integro` (full article text) from the database, or `verificada: false` with an error reason

### Stage 3: Content Match Verification (`verifyContentMatch`)

For verified citations, performs deterministic checks that the AI's claims match the actual article text:

1. **Deadline verification**: Extracts numerical deadlines from the claim (e.g., "10 dias", "tres meses") and verifies they exist in the article text. Handles both numeric and written-out numbers (Spanish: "diez" = 10, "quince" = 15). Returns `confidence: 'high'`.

2. **Institutional keyword verification**: Checks if institutional names mentioned in the claim (e.g., "Consejo de Ministros", "Tribunal", "Defensor del Pueblo") actually appear in the article text. Returns `confidence: 'medium'`.

3. **No verifiable content**: If neither deadlines nor institutions are found, returns `match: true` with `confidence: 'low'` (benefit of the doubt).

### Stage 4: Orchestration (`verifyAllCitations`)

Orchestrates stages 1-3 and logs verification KPIs:

```
citations_total, citations_verified, citations_failed,
verification_score, regeneration_triggered, duration_ms
```

If `verification_score < 0.5` (fewer than half the citations verified), the test generation pipeline triggers a regeneration attempt.

### Integration with Test Generation

In `lib/ai/generate-test.ts`, after the AI generates questions:

1. Each question's citation is verified via `verifyCitation()`
2. For Bloque I (legal): questions with unverified citations are **discarded**
3. If discarding reduces the question count below the target, a retry is triggered (up to `MAX_RETRIES = 2`)
4. For Bloque II (office tools): a different guardrail (`verificarPreguntaBloque2()`) checks that answer options exist in the retrieved context

### Bloque II Guardrail

Bloque II questions (Word, Excel) do not have legal citations. Instead, `verificarPreguntaBloque2()` verifies that the content of each answer option (menu paths, function names, keyboard shortcuts) exists in the retrieved `conocimiento_tecnico` context. This prevents the AI from inventing non-existent menu items.

## Consequences

### Positive

- **Zero legal hallucinations**: Every citation shown to the user has been verified against the database. If the article does not exist, the question is discarded.
- **Deterministic**: No AI involvement in verification. The checks are regex-based and database lookups -- fully reproducible.
- **Content accuracy**: Deadline and institution checks catch the most dangerous type of hallucination (wrong numbers, wrong entities).
- **Observable**: KPI logging enables tracking verification quality over time and across prompt versions.
- **Self-healing**: The retry mechanism means that if the AI generates low-quality questions, the pipeline automatically regenerates.

### Negative

- **Recall gap**: The regex extractor may miss unconventional citation formats. If a citation is not extracted, it cannot be verified. Mitigated by supporting multiple patterns.
- **Database dependency**: Verification requires the `legislacion` table to be populated with all relevant articles. Missing articles cause false rejections. The ingestion pipeline (`pnpm ingest:legislacion`) must be kept up to date.
- **Content match limitations**: `verifyContentMatch` only checks deadlines and institutions. Other types of claims (e.g., "the procedure requires X documents") are not verified deterministically. These get `confidence: 'low'` and pass through.
- **Performance cost**: Each question verification involves 1-2 database queries. For a 10-question test with retries, this can be 20-40 queries. Mitigated by the stateless Supabase client with connection pooling.

### Alternatives Considered

1. **AI self-verification** (asking the AI to verify its own citations): Rejected because probabilistic verification cannot guarantee correctness.
2. **Embedding similarity**: Compare claim embeddings against article embeddings. Rejected as too slow and still probabilistic.
3. **Human review queue**: Every test reviewed by a human before delivery. Rejected as unscalable for a solo developer.
