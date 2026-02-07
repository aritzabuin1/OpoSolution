# Estándares de Calidad y Testing

**Objetivo**: Cero errores críticos en producción y alta mantenibilidad.

## 1. Definición de "Hecho" (Definition of Done)

Un componente solo está terminado si:
1. **Unit Tests**: Cobertura >80% en lógica de negocio.
2. **Integration Tests**: Los flujos de punta a punta (ej. API -> LLM -> DB) funcionan.
3. **LLM Evals**: Si hay prompts complejos, se han testeado con al menos 5 casos de entrada diferentes para evitar alucinaciones.

## 2. Estructura de Directorio de Tests

Todos los tests deben organizarse bajo `tests/` con la siguiente estructura:

```
tests/
├── unit/           # Tests aislados de funciones y clases individuales
├── integration/    # Tests de flujos completos (API -> servicio -> DB)
├── evals/          # Validación de prompts y outputs de LLMs
├── fixtures/       # Datos de prueba compartidos (JSON, CSV, mocks)
└── conftest.py     # Fixtures globales de pytest
```

- Cada subdirectorio debe contener su propio `__init__.py`.
- Los fixtures reutilizables van en `conftest.py` del nivel apropiado.

## 3. Convenciones de Naming

- **Archivos**: `test_[modulo]_[comportamiento].py` (ej. `test_parser_handles_empty_input.py`).
- **Funciones**: `test_[unidad]_[escenario]_[resultado_esperado]` (ej. `test_extract_email_with_invalid_format_returns_none`).
- **Clases** (si se agrupan): `TestNombreModulo` (ej. `TestEmailParser`).
- Los nombres deben ser descriptivos. Un test cuyo nombre no explica qué valida es un test mal escrito.

## 4. Mocking de APIs Externas

- **Principio fundamental**: Los unit tests NUNCA deben hacer llamadas reales a APIs externas (LLMs, bases de datos, servicios de terceros).
- Usar `pytest-mock` o `monkeypatch` para sustituir dependencias externas con respuestas controladas.
- Los mocks deben reflejar la estructura real de las respuestas del servicio que sustituyen.
- Mantener fixtures de ejemplo en `tests/fixtures/` para respuestas típicas de APIs.
- Los integration tests PUEDEN usar APIs reales, pero deben estar marcados con `@pytest.mark.integration` para poder excluirlos en CI rápido.

## 5. Cobertura (Coverage)

- **Objetivo**: >80% en lógica de negocio (servicios, parsers, transformaciones de datos).
- **No es necesario cubrir**: boilerplate, configuración, modelos de datos puros sin lógica, código autogenerado.
- La cobertura es una métrica orientativa, no un objetivo absoluto. Un test inútil que sube cobertura es peor que no tenerlo.
- Ejecutar con `--cov` y revisar qué ramas de lógica crítica quedan sin cubrir.

## 6. Anti-Patterns a Evitar

| Anti-Pattern | Por qué es problemático |
|---|---|
| Testear detalles de implementación | Se rompe al refactorizar sin que cambie el comportamiento |
| Tests que dependen de orden de ejecución | Generan fallos intermitentes imposibles de diagnosticar |
| Testear código de terceros (SDKs, librerías) | No es nuestra responsabilidad; solo testear nuestra integración con ellos |
| Tests sin assertions claras | Un test que no puede fallar no valida nada |
| Datos de test hardcodeados en el propio test | Dificulta mantenimiento; usar fixtures en `tests/fixtures/` |
| Tests que requieren estado externo (DB real, API real) sin marcar | Bloquean CI; marcar siempre con `@pytest.mark.integration` |

## 7. Herramientas

- Usar `pytest` como framework principal para toda la lógica Python.
- Usar scripts en `execution/` para validación de prompts (Evals).
- Resultados de tests críticos deben quedar documentados en el log del proyecto.
- Plugins recomendados: `pytest-cov` (cobertura), `pytest-mock` (mocking), `pytest-asyncio` (código async).
