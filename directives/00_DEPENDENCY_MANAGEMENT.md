# SOP: Dependency Management & Security

**Objective**: Prevenir supply chain attacks y asegurar license compliance en todas las dependencias del proyecto.

---

## 1. Entorno Virtual (Requisito Obligatorio)

- **SIEMPRE** usar un virtual environment (`venv`, `conda`, o equivalente). Nunca instalar paquetes de forma global.
- El entorno virtual debe estar en `.gitignore` y ser reproducible desde `requirements.txt` o `pyproject.toml`.
- Documentar en el README del proyecto como recrear el entorno.

---

## 2. Version Pinning

- Todas las dependencias en `requirements.txt` deben tener versiones exactas (e.g., `fastapi==0.109.0`).
- No se permiten floating versions en produccion (nada de `>=`, `~=`, `*`).
- Generar el fichero de lock con `pip freeze > requirements.txt` despues de cada cambio de dependencias.
- Para desarrollo, se puede mantener un `requirements-dev.txt` separado con herramientas de testing/linting.

---

## 3. Checklist: Antes de Anadir una Nueva Dependencia

Antes de hacer `pip install` de cualquier paquete nuevo, evaluar:

- [ ] **Necesidad real**: Puede resolverse con la standard library o con codigo propio en pocas lineas?
- [ ] **Mantenimiento activo**: El paquete tiene commits recientes? Tiene maintainers activos? Cuantas issues abiertas sin respuesta?
- [ ] **Adopcion**: Tiene una base de usuarios razonable? (descargas, stars, uso en proyectos conocidos)
- [ ] **Licencia**: Es compatible? (ver seccion 5)
- [ ] **Tamano e impacto**: Cuantas dependencias transitivas arrastra? Anade bloat innecesario?
- [ ] **Alternativas**: Hay opciones mas ligeras o mejor mantenidas que cumplan el mismo proposito?
- [ ] **Seguridad**: Tiene vulnerabilidades conocidas? Verificar con `pip-audit` antes de integrar.

Si la respuesta a "Necesidad real" es NO, no anadir la dependencia.

---

## 4. Security Scanning (CVEs)

- Usar `pip-audit`, `Snyk`, o herramienta equivalente para buscar vulnerabilidades conocidas antes de cualquier merge significativo.
- Integrar el scanning en CI/CD si el proyecto lo permite.

### Tabla de respuesta segun severidad

| Severidad | Tiempo maximo de respuesta | Accion |
|-----------|---------------------------|--------|
| **Critical** | 24 horas | Parchear o eliminar la dependencia inmediatamente |
| **High** | 1 semana | Priorizar en el sprint actual |
| **Medium** | Siguiente sprint | Planificar la actualizacion |
| **Low** | Siguiente revision periodica | Evaluar y actualizar cuando sea conveniente |

- Si no existe parche disponible para una vulnerabilidad Critical/High, evaluar alternativas o mitigaciones temporales y documentar la decision en un ADR.

---

## 5. License Compliance

- Licencias permitidas sin restriccion: **MIT**, **Apache 2.0**, **BSD** (2-clause y 3-clause).
- Cualquier dependencia con licencia **GPL**, **AGPL**, **LGPL** u otra copyleft requiere **aprobacion explicita de Aritz** antes de integrarla.
- Verificar licencias de dependencias transitivas, no solo de las directas.
- En caso de duda, consultar antes de integrar.
