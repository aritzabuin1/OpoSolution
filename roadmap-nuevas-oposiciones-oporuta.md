# Roadmap de Nuevas Oposiciones para OpoRuta

> Documento para Claude Code: fichas técnicas de oposiciones a implementar, por orden de prioridad.
> OpoRuta YA ofrece corrección con IA de ejercicios de desarrollo (diferenciador único).
> Verificado contra BOE y fuentes oficiales. Fecha: 24/03/2026

---

## CAPACIDADES DE OPORUTA (para Claude Code)

OpoRuta puede cubrir:
- ✅ **Tests tipo test** (100% de las oposiciones tipo test)
- ✅ **Corrección de ejercicios de desarrollo con IA** (ya implementado para A2 Administrativo — NADIE MÁS EN EL MERCADO LO OFRECE)
- ✅ **Psicotécnicos** (a implementar como módulo transversal)
- 🔮 **Futuro: Preparación de exámenes orales** (el usuario graba, se transcribe, IA evalúa)

Esto significa que TODAS las oposiciones del roadmap son viables, incluso las que tienen ejercicios de desarrollo.

---

## TIER 1 — IMPLEMENTAR YA (Abril 2026)

---

### 1. CORREOS (Personal Laboral Fijo — Grupo IV)

| Campo | Valor |
|-------|-------|
| **Tipo** | Personal laboral fijo (empresa pública SEPI, NO funcionario) |
| **Titulación** | ESO o equivalente (18+ años) |
| **Plazas esperadas** | ~4.000+ (plan plurianual 2025-2028, convocatoria pendiente primer semestre 2026) |
| **Última convocatoria** | 7.757 plazas (examen 07/05/2023) |
| **Estado convocatoria 2026** | Pendiente de publicación. CCOO confirma primer semestre 2026 |
| **Sistema** | Concurso-oposición (examen 60 pts + méritos 40 pts) |
| **Inscritos estimados** | ~100.000+ |
| **Nacionalidad** | Española O UE (más flexible que AGE) |
| **Puestos** | Reparto (pie/moto/coche), Atención al cliente, Agente de clasificación |

**EXAMEN — Un único ejercicio:**

| Aspecto | Detalle |
|---------|---------|
| **Preguntas** | 100 total: 90 de temario + **10 psicotécnicas** |
| **Opciones** | 4 (1 correcta) |
| **Duración** | 110 minutos |
| **Puntuación máxima** | 60 puntos |
| **Acierto** | +0,60 puntos |
| **Error** | **0 puntos — NO PENALIZA (responder SIEMPRE)** |
| **Méritos** | Hasta 40 puntos adicionales (experiencia Correos, idiomas, carnet, formación) |

**⚠️ CLAVE:** Los errores NO penalizan. Hay que responder TODAS las preguntas. Diferente a Justicia/AGE.
**⚠️ PSICOTÉCNICOS:** 10 preguntas de series numéricas, lógica, razonamiento. Requiere módulo nuevo o aviso.

**Temario: 12 temas**

| Tema | Título |
|------|--------|
| 1 | Marco normativo postal. Naturaleza jurídica de Correos. Organismos reguladores. Organizaciones postales internacionales. Organización del Grupo Correos. |
| 2 | Organización interna de Correos. Red de oficinas. Zonas y sectores de reparto. Unidades de distribución. |
| 3 | Productos y servicios postales: cartas, paquetería, servicios especiales. Tarifas. |
| 4 | Servicios financieros y parapostales. Giros. Envíos contra reembolso. Burofax. Telegrama. |
| 5 | Soluciones logísticas: paquetería express, e-commerce, logística inversa. Correos Express. |
| 6 | Procesos de admisión de envíos postales y telegráficos. |
| 7 | Procesos de clasificación, tratamiento y transporte. La Norma Reguladora. |
| 8 | Procesos de distribución y entrega. |
| 9 | Atención al cliente. Servicio de reclamaciones. Calidad de servicio. |
| 10 | Igualdad, diversidad e inclusión. Prevención de riesgos laborales en Correos. |
| 11 | Certificado digital y firma electrónica. Notificaciones electrónicas. Administración electrónica. |
| 12 | Protección de datos. RGPD. |

**Fuentes:** Web Correos Personas y Talento (temario oficial) | Exámenes anteriores publicados post-convocatoria

**Scoring para OpoRuta:**
```
acierto: +0.60, error: 0, blanco: 0, max: 60, penaliza: false
```

---

### 2. GESTIÓN PROCESAL Y ADMINISTRATIVA (A2 Justicia)

| Campo | Valor |
|-------|-------|
| **Grupo** | A2 |
| **Titulación** | Grado universitario, Licenciatura, Diplomatura |
| **Plazas** | **725** turno libre (Orden PJC/1549/2025, BOE 30/12/2025) |
| **Fecha examen** | Sept-Oct 2026 (mismo día que Auxilio y Tramitación) |
| **Inscritos** | ~15.000 |

**EXAMEN — 3 ejercicios (mismo día):**

**Ej.1 — Test teórico** ✅
- 100 preguntas + 4 reserva | 100 min | máx 60 pts
- Acierto +0,60 | Error -0,15 | Mín 30 pts

**Ej.2 — Supuesto práctico (TEST)** ✅
- 10 preguntas + 2 reserva | 30 min | máx 15 pts
- Acierto +1,50 | Error -0,30 | Mín 7,5 pts

**Ej.3 — Preguntas de DESARROLLO** ✅ (OpoRuta puede corregir con IA)
- 5 preguntas de desarrollo escrito | 45 min | máx 25 pts
- Contenido: Derecho Procesal (temas 17-39 y 43-67)
- Espacio de respuesta limitado por el tribunal

**Temario: 68 temas** (Bloque I: 16 temas organización — Bloque II: 52 temas procedimientos)

> Los temas 1-16 solapan con Auxilio/Tramitación pero con mayor profundidad. El temario completo está en el Anexo VI.a del BOE-A-2025-27053.

**Fuente BOE:** https://www.boe.es/boe/dias/2025/12/30/pdfs/BOE-A-2025-27053.pdf

---

## TIER 2 — IMPLEMENTAR MAYO-JUNIO 2026

---

### 3. AGENTES DE LA HACIENDA PÚBLICA (C1 — AEAT)

| Campo | Valor |
|-------|-------|
| **Grupo** | C1 |
| **Titulación** | Bachillerato o Técnico |
| **Plazas** | **1.000** turno libre + 400 promoción interna = 1.400 total |
| **Convocatoria** | BOE 30/12/2025 |
| **Fecha examen** | **Mayo 2026** (entre 9-23 mayo — MUY PRONTO) |
| **Inscritos** | ~15.000-25.000 |

**⚠️ TIMING:** El examen de la convocatoria actual es en mayo 2026. Para captar opositores de ESTA convocatoria, habría que tener la oposición lista en abril. Si no se llega, la implementación sirve para: (a) opositores que suspenden y repiten, (b) la siguiente convocatoria OEP 2026.

**EXAMEN — 2 ejercicios:**

**Ej.1 — Test teórico** ✅
- **80 preguntas** (cambio 2026, antes eran 100) | **90 min** (antes 100)
- Penalización: 1/3 del valor del acierto
- Contenido: todo el temario (32 temas)

**Ej.2 — Supuestos prácticos de DESARROLLO** ✅ (OpoRuta puede corregir con IA)
- 10 supuestos prácticos escritos (NO tipo test)
- 150 minutos (2h 30min)
- Contenido: Bloque III (Hacienda Pública y Derecho Tributario, temas del bloque III)

**Temario: 32 temas (3 bloques)**

- **Bloque I** (5 temas): Constitución, Cortes, Gobierno, Organización Territorial, Funcionamiento electrónico
- **Bloque II** (5 temas): Procedimiento administrativo, recursos, actos administrativos
- **Bloque III** (22 temas): Sistema fiscal, AEAT, Derecho Tributario, IRPF, Sociedades, IVA, procedimientos tributarios, infracciones y sanciones

> Bloque III es el más importante — base del Ej.2 práctico y mayor peso en Ej.1

**Fuente BOE:** BOE 30/12/2025, Resolución Presidencia AEAT

---

### 4. AYUDANTES DE INSTITUCIONES PENITENCIARIAS (C1)

| Campo | Valor |
|-------|-------|
| **Grupo** | C1 |
| **Titulación** | Bachillerato o equivalente |
| **Plazas** | **900** (OEP 2025, BOE 09/10/2025) |
| **Estado** | Examen Ej.1 celebrado **18 enero 2026**. Proceso en fase de prácticas |
| **Próxima convocatoria** | OEP 2026, esperada finales 2026, examen ~primer semestre 2027 |
| **Convocatoria anual** | SÍ — 756 (2023), 800 (2024), 900 (2025) |
| **Inscritos** | ~12.000-18.000 |
| **Sueldo** | ~25.000-30.000€ brutos/año |
| **Destinos** | Centros penitenciarios toda España (excepto Cataluña/País Vasco) |

**⚠️ TIMING:** El proceso 2025 ya terminó su fase de examen. OpoRuta apunta a la siguiente convocatoria (OEP 2026, examen ~2027). Implementar ahora permite captar opositores que empiezan a prepararse con antelación.

**EXAMEN — 2 ejercicios:**

**Ejercicio 1 — Dos partes el mismo día** ✅

*Parte 1: Test teórico*
- **120 preguntas** + 3 de reserva
- 4 opciones, 1 correcta
- Duración: **1h 45min** (105 minutos)
- Penalización: **1/3 del valor del acierto** por error
- En blanco: no penaliza
- Puntuación: 0-20 puntos, mínimo **10 puntos** para pasar

*Parte 2: Supuestos prácticos (TIPO TEST)* ✅
- **8 supuestos prácticos × 5 preguntas cada uno = 40 preguntas tipo test**
- 4 opciones, 1 correcta
- Duración: **1h 20min** (80 minutos)
- Penalización: **1/3 del valor del acierto** por error
- Puntuación: 0-20 puntos, mínimo **10 puntos** para pasar
- Solo se corrige si se supera la Parte 1

**Total preguntas tipo test: 160 (120 + 40)**

**Ejercicio 2 — Reconocimiento médico**
- Apto / No Apto
- Cuadro de exclusiones médicas del Ministerio del Interior
- No aplica para OpoRuta

**Temario: 50 temas (4 módulos)**

**Módulo 1 — Organización del Estado y Administración (17 temas)**
Constitución, Poder Judicial, Gobierno, Organización Territorial, UE, Estructura Ministerio Interior, SGIIPP, Personal IIPP, Régimen jurídico empleados públicos, Empleo público, Contratos, Voluntariado, Políticas Públicas, Gobierno Abierto, Actividad Administraciones, Fuentes Derecho Administrativo, Presupuesto.

**Módulo 2 — Derecho Penal (10 temas)**
Derecho Penal, Delitos, Circunstancias modificativas, Penas, Delitos contra personas, Delitos libertad sexual, Delitos patrimonio, Delitos salud pública, Jurisdicción penal, Procedimientos penales y Habeas Corpus.

**Módulo 3 — Derecho Penitenciario (20 temas)**
LOGP, Reglamento Penitenciario, Régimen penitenciario, Clasificación, Tratamiento, Trabajo penitenciario, Prestaciones, Régimen disciplinario, Libertad condicional, Comunicaciones, Permisos, Beneficios, Medidas seguridad, Sanidad penitenciaria, etc.

**Módulo 4 — Conducta Humana (3 temas)**
Psicología de la conducta, Personalidad, Habilidades sociales y resolución de conflictos.

> **Nota:** El Módulo 3 (Derecho Penitenciario, 20 temas) es 100% específico de esta oposición. No solapa con ninguna otra. Requiere generación de preguntas desde cero, sin reutilizar banco de otras oposiciones.

**Fuente BOE:** Resolución 03/10/2025 (BOE 09/10/2025, núm. 243)

**Scoring para OpoRuta:**
```
Parte 1: preguntas: 120, duracion: 105min, acierto: variable, error: -1/3_acierto, max: 20, min: 10
Parte 2: preguntas: 40, duracion: 80min, acierto: variable, error: -1/3_acierto, max: 20, min: 10
```

---

## TIER 3 — IMPLEMENTAR JULIO-SEPTIEMBRE 2026

---

### 5. AUXILIAR ADMINISTRATIVO CCAA — MADRID (C2)

| Campo | Valor |
|-------|-------|
| **Plazas** | 645 (BOCM 18/02/2026) |
| **Titulación** | ESO |
| **Formato** | Test tipo test (similar a Auxiliar AGE + temario autonómico Madrid) |
| **Inscritos** | ~15.000+ |
| **Implementación** | Media — requiere añadir Estatuto de Autonomía Madrid + organización CAM |

### 6. AUXILIAR ADMINISTRATIVO CCAA — ANDALUCÍA (C2)

| Campo | Valor |
|-------|-------|
| **Plazas** | ~1.000+ (convocatoria periódica Junta) |
| **Formato** | Test tipo test + temario autonómico Andalucía |
| **Inscritos** | ~20.000+ |
| **Implementación** | Media — Estatuto Autonomía Andalucía + organización Junta |

### 7. CELADORES / AUX. ADMIN. SAS (Servicio Andaluz de Salud)

| Campo | Valor |
|-------|-------|
| **Plazas** | Miles (varía por OEP sanitaria) |
| **Formato** | Test tipo test + temario sanitario específico |
| **Inscritos** | ~30.000+ |
| **Implementación** | ALTA — temario sanitario muy diferente a AGE/Justicia |
| **Recomendación** | Dejar para Q4 2026 o 2027. Alto esfuerzo, temario divergente |

---

## RESUMEN EJECUTIVO

| # | Oposición | Plazas | Inscritos | Cuándo | Test? | Desarrollo? | Mercado acum. |
|---|-----------|--------|-----------|--------|-------|-------------|---------------|
| ✅ | Aux. Admin C2 AGE | 1.700 | ~45K | Ya | ✅+psico | — | 45K |
| ✅ | Admin C1 AGE | 2.512 | ~40K | Ya | ✅+psico | ✅ supuesto | 85K |
| ✅ | Gestión A2 AGE | ~500 | ~10K | Ya | ✅ | ✅ supuesto | 95K |
| ✅ | Auxilio Judicial C2 | 425 | ~24K | Ahora | ✅ | — | 119K |
| ✅ | Tramitación C1 | 1.155 | ~30K | Ahora | ✅ | — | 149K |
| 🔴 | **Correos** | 4.000+ | **~100K** | **Abril** | ✅+psico | — | **249K** |
| 🔴 | **Gestión Procesal A2** | 725 | ~15K | **Abril** | ✅ | ✅ desarrollo | 264K |
| 🟡 | **Agentes Hacienda** | 1.000 | ~20K | Mayo-Jun | ✅ | ✅ desarrollo | 284K |
| 🟡 | **Ayudantes IIPP** | 900 | ~15K | Mayo-Jun | ✅ (160 preg) | — | 299K |
| 🟢 | Aux. Admin Madrid | 645 | ~15K | Jul-Sep | ✅ | — | 314K |
| 🟢 | Aux. Admin Andalucía | 1.000+ | ~20K | Jul-Sep | ✅ | — | 334K |
| 🟢 | Celadores SAS | Miles | ~30K+ | Sep+ | ✅ | — | 364K+ |

---

## MÓDULO TRANSVERSAL: PSICOTÉCNICOS

Oposiciones que incluyen psicotécnicos: Correos (10 preg), Aux. Admin AGE, Admin AGE.

Implementar UN módulo de psicotécnicos reutilizable:
- Series numéricas
- Series de letras
- Razonamiento lógico / analogías
- Razonamiento verbal
- Figuras y patrones espaciales

Este módulo se activa según la oposición. El banco de psicotécnicos es transversal (no depende de legislación → no se invalida por cambios legislativos → crece y se cachea indefinidamente).

---

## NOTA PARA CLAUDE CODE — ORDEN DE IMPLEMENTACIÓN

1. **Correos** → Temario corto (12 temas), formato simple (1 ejercicio), mercado enorme. Implementar scoring sin penalización. Avisar sobre psicotécnicos (implementar o avisar que no se cubren aún).

2. **Gestión Procesal** → Reutilizar mucho del banco de Auxilio/Tramitación (temas 1-16 solapan). Añadir temas 17-68. Implementar corrección IA del Ej.3 (desarrollo) reutilizando sistema del A2 Administrativo.

3. **Agentes Hacienda** → Temario parcialmente nuevo (Bloque III tributario es 100% nuevo). Implementar corrección IA del Ej.2 (desarrollo). El Ej.1 es test estándar con 80 preguntas.

4. **IIPP** → Temario largo (50 temas) y muy específico (Derecho Penitenciario). No reutiliza banco de otras oposiciones para Módulos 2-4. Scoring especial: dos partes con mínimo 10/20 cada una.

5. **CCAA** → Tronco común reutilizable + módulo autonómico específico por comunidad.

**Verificar SIEMPRE contra el BOE de cada convocatoria** antes de configurar la oposición. Los datos de este documento están verificados a 24/03/2026 pero pueden cambiar con nuevas convocatorias.
