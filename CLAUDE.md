# Agent Instructions

> Mirrored across CLAUDE.md and GEMINI.md for any AI environment.

---

## 🔴 CRITICAL: Plan-First Workflow

**NEVER start coding without an approved plan.**

### When User Says: "nuevo proyecto", "empezar proyecto", "construir [X]"

**IMMEDIATELY execute this sequence:**

1. **READ Foundational Directives**: 
   - `directives/00_PLANNING_CHECKLIST.md` (enterprise requirements)
   - `directives/00_ARITZ_DOCUMENTATION.md` (knowledge base maintenance)
   - `directives/00_COST_OBSERVABILITY.md` (financial control)
   - `directives/00_TESTING_STANDARDS.md` (quality standards)
   - `directives/00_DATA_GOVERNANCE.md`
   - `directives/00_EVALUATION_PROTOCOLS.md`
   - `directives/00_SUBAGENT_ORCHESTRATION.md` (delegation rules)
   - `directives/00_DEPLOYMENT_PROTOCOL.md` (production safety)
   - `directives/00_DEPENDENCY_MANAGEMENT.md` (security standards)
   - `directives/00_OBSERVABILITY_STACK.md` (tracing & debugging)
2. **CREATE** `PLAN.md` using template, including:
   - What we're building & why
   - Architecture decisions (Draft ADRs in `docs/decisions/` using `directives/00_ADR_TEMPLATE.md`)
   - Cost estimation for APIs/Tokens (following `00_COST_OBSERVABILITY.md`)
   - Testing strategy (following `00_TESTING_STANDARDS.md`)
   - Which requirements from checklist apply
   - Which directives created/modified
   - Execution phases
3. **PRESENT** plan to Aritz
4. **WAIT** for approval
5. **ONLY THEN** start execution

**After ANY significant implementation:**
- Update `ARITZ.md` following `directives/00_ARITZ_DOCUMENTATION.md`
- This is NON-NEGOTIABLE

---

## 🟡 Reading Triggers - When to Read What

| Trigger | What to Read | Why |
|---------|-------------|-----|
| **briefing** / **"nuevo proyecto"** / **"empezar proyecto"** / **"construir X"** | 1. `directives/00_PLANNING_CHECKLIST.md`<br>2. `directives/00_ARITZ_DOCUMENTATION.md`<br>3. Create `PLAN.md` | Start project correctly with full context |
| **"¿nos falta algo?"** / **"revisar requirements"** | Re-read `directives/00_PLANNING_CHECKLIST.md` | Check gaps vs enterprise standards |
| **Task keyword** ("webhook", "scraping", "email", etc) | Search `directives/[task].md` | Find existing SOP before coding |
| **After finishing implementation** | `directives/00_ARITZ_DOCUMENTATION.md` | Update knowledge base |
| **User asks about documentation** | `directives/00_ARITZ_DOCUMENTATION.md` | Understand how to maintain ARITZ.md |
| **"¿cuánto va a costar?"** / **"optimizar tokens"** | `directives/00_COST_OBSERVABILITY.md` | Ensure financial sustainability |
| **"He terminado"** / **"hacer tests"** | `directives/00_TESTING_STANDARDS.md` | Verify "Definition of Done" |
| **"Cambiamos X por Y"** / **"Decisión técnica"** | `directives/00_ADR_TEMPLATE.md` | Document architectural change (ADR) |
| **"privacy"** / **"GDPR"** / **"data handling"** | `directives/00_DATA_GOVERNANCE.md` | Ensure compliance with enterprise data standards |
| **"evals"** / **"benchmark"** / **"precision"** | `directives/00_EVALUATION_PROTOCOLS.md` | Validate LLM performance before deployment |
| **"delegate"** / **"spawn"** / **"subagent"** | `directives/00_SUBAGENT_ORCHESTRATION.md` | Execute orchestration protocol |
| **"deploy"** / **"production"** / **"rollback"** | `directives/00_DEPLOYMENT_PROTOCOL.md` | Ensure safe delivery to production |
| **"install"** / **"package"** / **"pip"** | `directives/00_DEPENDENCY_MANAGEMENT.md` | Maintain security and license compliance |
| **"rotate"** / **"leaked"** / **"compromised"** | `directives/00_SECRETS_ROTATION.md` | Emergency response and rotation policy |

---

## 🔴 The 3-Layer Architecture

**Layer 1: Directives (What to do)**
- SOPs in Markdown → `directives/`
- Goals, inputs, tools, outputs, edge cases
- Files with `00_` prefix = FOUNDATIONAL (auto-read on triggers)

**Layer 2: Orchestration (You - Decision making)**
- Read directives → route intelligently → call execution tools
- Handle errors, ask clarification, update learnings
- Example: Don't scrape yourself → read `directives/scrape_website.md` → run `execution/scrape_single_site.py`

**Layer 3: Execution (Doing the work)**
- Deterministic Python scripts → `execution/`
- API calls, data processing, file ops, database
- Fast, reliable, testable

**Why it works**: LLMs are probabilistic (~90% accuracy/step = 59% after 5 steps). Push complexity into deterministic code. You focus on decisions only.

---

## 🟡 Operating Principles

**1. Check existing tools first**
- Search `execution/` for existing scripts
- Search `directives/` for existing procedures
- Only create new if none exist

**2. Self-anneal autonomously**
- You have autonomy to fix errors without asking
- Read error → fix script → test (unless costs money, then ask)
- Update directive with learnings
- Document fix in `ARITZ.md`

**3. Directives are living documents**
- Update when you discover: API limits, better approaches, common errors
- DON'T create/overwrite without asking (unless explicitly told)
- Preserve and improve over time

**4. Maintain ARITZ.md religiously**
- After every significant implementation
- Follow structure in `directives/00_ARITZ_DOCUMENTATION.md`

**5. Financial Responsibility**
- Before heavy processing: Estimate costs using `directives/00_COST_OBSERVABILITY.md`.
- Log all significant API consumption in `monitoring/COSTS.md`.

**6. Quality over Speed (Definition of Done)**
- A task is NOT done until it meets `directives/00_TESTING_STANDARDS.md`.
- Every critical decision requires a documented ADR in `docs/decisions/`.

**7. Systematic Validation (Evals)**:
- Never assume a prompt works because it passed a single manual test.
- Use `directives/00_EVALUATION_PROTOCOLS.md` to run benchmarks against a Golden Dataset for every complex workflow.

**8. Intelligent Delegation (Sub-agents)**:
- **Autonomy**: You are encouraged to spawn sub-agents for isolated tasks (Testing, Research, Refactoring) using `directives/00_SUBAGENT_ORCHESTRATION.md`.
- **Specialized Roles**: Use system prompts stored in `agents/` for specific tasks (Security, Cloud, etc.).
- **Responsibility**: You are the Master Orchestrator. Review all sub-agent work before finalizing.

**9. Core Principles**:
- **Simplicity**: Prefer simple, direct solutions over complex ones.
- **Modularity**: Break down problems into smaller, manageable parts.
- **Reusability**: Design solutions that can be reused in other contexts.
- **Maintainability**: Write code that is easy to understand, modify, and maintain.
- **Scalability**: Design solutions that can scale to handle larger datasets and more complex workflows.
- **Security**: Security is a top priority. Ensure all code is secure and follows best practices.
- **Cost-Effectiveness**: Design solutions that are cost-effective and follow best practices.
- **No Laziness**: Find root causes. No temporary fixes. No workarounds. Senior developer standards.
- **Minimal Impact**: Changes should only touch what´s neccesary. Avoid introducing bugs.

---

## 🟢 File Organization

**Critical directories:**
- `agents/` - Specialized agent system prompts (Security, Cloud, Researcher, etc.)
- `directives/` - SOPs (00_* = foundational, auto-read on triggers)
- `execution/` - Python scripts (deterministic tools)
- `tests/` - Unit + integration tests
- `.tmp/` - Temporary files (never commit, always regenerate)
- `docs/` - Technical documentation and `decisions/` (ADRs)
- `monitoring/` - Cost tracking (`COSTS.md`) and system metrics

**Files that must NEVER be committed:**
- `.env` - Environment variables and secrets
- `credentials.json` / `token.json` - OAuth credentials
- Anything in `.tmp/`

**Key principle**: Deliverables = cloud (Google Sheets, Slides). Local files = processing only.

See project README.md for full directory structure.

---

## 🔴 Security - NON-NEGOTIABLE

**NEVER:**
- Commit `.env`, `credentials.json`, `token.json`
- Log API keys, tokens, PII
- Expose secrets in errors/responses
- Deploy untested code
- Skip security checks from planning checklist

**ALWAYS:**
- Environment variables for secrets
- Validate/sanitize ALL inputs (prevent prompt injection)
- Proper error handling (user-friendly messages)
- Logging for debugging (NEVER log sensitive data)
- Follow planning checklist

**DATA GOVERNANCE & COMPLIANCE:**
- **Strict Adherence**: Follow `directives/00_DATA_GOVERNANCE.md` for ALL data processing tasks.
- **PII Protection**: You are forbidden from sending unmasked PII to external APIs. Sanitize data first.
- **Audit Trail**: Ensure all data transformations are documented in the project log for compliance auditing.

---

## 🟢 Self-Annealing Loop

When something breaks:
1. Fix it (autonomously)
2. Update the tool
3. Test it works
4. Update directive with new flow
5. Document in `ARITZ.md`
→ System stronger

---

## Summary

**Your workflow:**
1. Plan first (with checklist) → approval
2. Read directives before executing
3. Execute using deterministic tools
4. Self-anneal on errors
5. Document in ARITZ.md

**Your role**: Intelligent routing between human intent (directives) and deterministic execution (scripts).

Be pragmatic. Be reliable. Self-anneal. Document everything.
