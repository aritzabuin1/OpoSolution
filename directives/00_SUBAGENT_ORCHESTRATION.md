# SOP: Sub-agent Orchestration & Delegation

**Objective**: Escalar la inteligencia spawneando instancias especializadas para tareas aisladas, manteniendo el control del Master Agent.

---

## 1. Delegation Triggers (Cuando spawnear)

- **Context Saturation**: La sesion actual supera ~100k tokens y se inicia una tarea compleja nueva.
- **Task Isolation**: Refactoring de un modulo especifico, generacion de documentacion, o deep research.
- **Specialization**: La tarea requiere expertise definida en `agents/*.md` (e.g., Security, UI/UX, Cloud Infra).
- **Parallelism**: Ejecutar tests largos mientras se continua con desarrollo.

---

## 2. Delegation Protocol (El Brief)

El Master Agent DEBE proporcionar al sub-agent:

1. **Scope**: Ficheros y directorios especificos a los que tiene acceso.
2. **Objective**: Un "Definition of Done" claro e inequivoco.
3. **Reference**: Directives aplicables de `directives/`.
4. **Constraints**: Limites de presupuesto y "Forbidden Actions" (e.g., "No modificar el entry point principal").

---

## 3. Results Integration & Review

- Los sub-agents NO pueden hacer commit de codigo sin review del Master.
- El Master Agent DEBE verificar el output del sub-agent contra `directives/00_TESTING_STANDARDS.md`.
- Los resultados deben ser resumidos por el sub-agent antes de cerrar la sesion.

---

## 4. Como Delegar (Selecciona tu Entorno)

Identifica tu entorno de ejecución y selecciona el protocolo adecuado.

### 4.1. Opción A: Claude Code (Process Spawning)

**Trigger**: Estás ejecutándote en la CLI de `Claude Code`.
**Acción**: Usar el tool `Task` para spawnear un sub-agent.

```python
Task(subagent_type="general-purpose", prompt="
  Role: Read and adopt agents/security-reviewer.md
  Scope: execution/ and tests/
  Objective: Find security vulnerabilities
  Constraints: Read-only, do not modify files
  Output: List of issues by severity
")
```

Para detalles sobre roles disponibles, ver `agents/README.md`.

### 4.2. Opción B: Antigravity / Agentic IDE (Asunción de Rol)

**Trigger**: Estás ejecutándote en `Antigravity` (Google) o una extensión de IDE donde no existe `Task()`.
**Acción**: Usar **Asunción de Rol** vía `task_boundary`. No spawneas un proceso nuevo; te *conviertes* en el especialista temporalmente.

**Protocolo**:
1.  **Leer Contexto**: `view_file agents/[role].md` para internalizar la persona del experto.
2.  **Cambiar Rol**: Llamar a `task_boundary` con:
    *   `TaskName`: "Executing as [Role Name]"
    *   `Mode`: "EXECUTION"
    *   `TaskStatus`: "Adopting [Role] persona to [Objective]"
3.  **Ejecutar**: Realizar la tarea adhiriéndose estrictamente a las constraints del archivo del agente.
4.  **Retornar**: Llamar a `task_boundary` para volver al rol de "Orchestrator".
    *   `TaskName`: "[Original Task]"
    *   `TaskStatus`: "Integrating results from [Role]"

---

## 5. Protocolo de Escalación (Cuando un sub-agent falla)

Seguir esta cadena de escalación estrictamente:

1. **Retry automático**: Si el sub-agent falla, reintentar UNA vez con el mismo brief. Fallos transitorios (timeouts, rate limits) suelen resolverse así.
2. **Master asume la tarea**: Si el segundo intento también falla, el Master Agent asume la tarea directamente con su propio contexto.
3. **Escalar a Aritz**: Si el Master tampoco puede resolver (falta de información, decisión de negocio, acceso que no tiene), escalar a Aritz con:
   - Qué se intentó hacer
   - Por qué falló (error concreto o bloqueo)
   - Qué opciones existen para resolverlo

**Nunca** dejar una tarea delegada en estado fallido sin escalar. Cada fallo debe resolverse o documentarse.

---

## 6. Consideraciones de Coste

- **Los sub-agents consumen tokens**.
    *   **Claude Code**: Cada spawn es una sesión independiente.
    *   **Antigravity**: La asunción de rol suma al contexto de la sesión *actual*.
- **Incluir el coste estimado de sub-agents** en la estimación de costes del proyecto (ver `directives/00_COST_OBSERVABILITY.md`).
- Evitar spawnear/cambiar de rol para tareas triviales que el Master puede resolver en pocas iteraciones.
- Si una tarea requiere múltiples sub-agents en paralelo, estimar el coste agregado antes de lanzarlos.
