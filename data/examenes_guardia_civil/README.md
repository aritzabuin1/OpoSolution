# Examenes Oficiales — Guardia Civil (Cabos y Guardias)

## Formato
- 100 preguntas + 5 reserva
- 4 opciones (A, B, C, D)
- Penalizacion: 1/3
- Tiempo: 60 minutos
- Modelos: 2 ejercicios con modelos A/B cada uno

## PDFs A DESCARGAR

### 2024 (Promocion 130)

**Ejercicio 1 — Conocimientos (28 septiembre 2024)**
- Cuestionario 1A: https://www.aspirantes.es/wp-content/uploads/2024/10/INGRESO_GC_2024_1A.pdf
- Cuestionario 1B: https://www.aspirantes.es/wp-content/uploads/2024/10/INGRESO_GC_2024_1B.pdf

**Ejercicio 2 — Idioma/Ortografia (28 septiembre 2024)**
- Cuestionario 2A: https://www.aspirantes.es/wp-content/uploads/2024/10/INGRESO_GC_2024_2A.pdf
- Cuestionario 2B: https://www.aspirantes.es/wp-content/uploads/2024/10/INGRESO_GC_2024_2B.pdf

**Ejercicio 3 — Ortografia/Gramatica (13 octubre 2024)**
- Cuestionario 3A: https://www.aspirantes.es/wp-content/uploads/2024/10/INGRESO_GC_2024_3A.pdf
- Cuestionario 3B: https://www.aspirantes.es/wp-content/uploads/2024/10/INGRESO_GC_2024_3B.pdf

**Plantillas respuestas:**
- Plantilla 3B: https://serguardiacivil.es/wp-content/uploads/2024/10/plantilla_examen_guardia_civil_2024_3B_28_09_24.pdf
- Todas las plantillas: https://academiacentroguardiacivil.es/plantillas-de-respuestas-disponibles-para-las-pruebas-de-guardia-civil-2024/

**Analisis completo:**
- JUCIL: https://jucil.es/wp-content/uploads/2024/11/Estudio-de-examen-Ingreso-Guardia-Civil-2024-Promocion-130-1.pdf

### 2023 (Promocion 129)

**Ejercicio 1 — Conocimientos (28 octubre 2023)**
- Cuestionario 1A: https://www.aspirantes.es/wp-content/uploads/2023/11/INGRESO_GC_2023_1A.pdf
- Cuestionario 1B: https://www.aspirantes.es/wp-content/uploads/2023/11/INGRESO_GC_2023_1B.pdf

**Ejercicio 2 — Idioma/Ortografia**
- Cuestionario 2A: https://www.aspirantes.es/wp-content/uploads/2023/11/INGRESO_GC_2023_2A.pdf
- Cuestionario 2B: https://www.aspirantes.es/wp-content/uploads/2023/11/INGRESO_GC_2023_2B.pdf

### 2025 (si disponible)
- Oficial GC TIPO A: https://web.guardiacivil.es/export/sites/guardiaCivil/documentos/pdfs/2025/Procesos_Selectivos_2025/IngresoGC_2025/INGRESO-GC-2025-TIPO-A-.pdf

## Que descargar para OpoRuta

Para OpoRuta solo necesitamos el **ejercicio de Conocimientos** (Ejercicio 1):
1. Descarga `INGRESO_GC_2024_1A.pdf` → guardar como `2024/examen_modelo_a.pdf`
2. Descarga `INGRESO_GC_2024_1B.pdf` → guardar como `2024/examen_modelo_b.pdf`
3. Descarga plantilla respuestas → guardar como `2024/plantilla_a.pdf` y `2024/plantilla_b.pdf`
4. Repetir para 2023

## Comandos despues de descargar
```bash
cd optek
pnpm parse:examenes --dir examenes_guardia_civil 2024 A
pnpm parse:examenes --dir examenes_guardia_civil 2024 B
pnpm parse:examenes --dir examenes_guardia_civil 2023 A
pnpm parse:examenes --dir examenes_guardia_civil 2023 B
pnpm ingest:examenes --dir examenes_guardia_civil --oposicion guardia-civil
```
