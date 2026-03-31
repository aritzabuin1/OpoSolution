# Examenes Oficiales — Policia Nacional (Escala Basica)

## Formato
- 100 preguntas, SIN reserva
- **3 opciones (A, B, C)** — UNICO en la plataforma
- Penalizacion: 1/2
- Tiempo: 50 minutos
- Modelos: A y B

## PDFs A DESCARGAR

### 2025 — Promocion 41 (1 marzo 2025)

**Examen Modelo A:**
- DEPOL: https://de-pol.es/wp-content/uploads/2025/03/EXAMEN_TEORIA_INGRESO_POLICIA_P41_A_2025-03-01_DEPOL_Ingreso.pdf
- Jurispol: https://blog.jurispol.com/wp-content/uploads/2025/03/Examen_teoria_ingreso_policia_p41_A.pdf

**Examen Modelo B:**
- Jurispol: https://blog.jurispol.com/wp-content/uploads/2025/03/EXAMEN_TEORIA_INGRESO_POLICIA_P41_B.pdf

**Plantilla respuestas:**
- Modelo A: https://blog.jurispol.com/wp-content/uploads/2025/03/Plantilla-modelo-A.pdf
- Modelo A (DEPOL): https://de-pol.es/wp-content/uploads/2025/03/HOJA_RESPUESTAS_EXAMEN_A_INGRESO_POLICIA_P41_2025-03-01_DEPOL_Ingreso.pdf
- Modelo B (DEPOL): https://de-pol.es/wp-content/uploads/2025/03/HOJA_RESPUESTAS_EXAMEN_B_INGRESO_POLICIA_P41_2025-03-01_DEPOL_Ingreso.pdf

**Analisis completo:**
- DEPOL: https://de-pol.es/wp-content/uploads/2025/03/ANALISIS_EXAMEN_TEORIA_INGRESO_POLICIA_P41_2025-03-01_DEPOL_Ingreso.pdf
- Jurispol: https://blog.jurispol.com/wp-content/uploads/2025/03/EXAMEN_INFORME_EB41-2.pdf

### 2024 — Promocion 40 (13 abril 2024)

**Examen Modelo A:**
- DEPOL: https://de-pol.es/wp-content/uploads/2024/04/EXAMEN_TEORIA_INGRESO_POLICIA_P40_A_2024-04-13_DEPOL_Ingreso.pdf

**Examen Modelo B:**
- DEPOL: https://de-pol.es/wp-content/uploads/2024/04/EXAMEN_TEORIA_INGRESO_POLICIA_P40_B_2024-04-13_DEPOL_Ingreso.pdf

**Plantilla respuestas:**
- Modelo A: https://de-pol.es/wp-content/uploads/2024/04/HOJA_RESPUESTAS_EXAMEN_TEORIA_A_13ABR2024_DEPOL_Ingreso.pdf
- Modelo B: https://de-pol.es/wp-content/uploads/2024/04/HOJA_RESPUESTAS_EXAMEN_TEORIA_B_13ABR2024_DEPOL_Ingreso.pdf

**Analisis:**
- DEPOL: https://de-pol.es/wp-content/uploads/2024/04/ANALISIS_EXAMEN_TEORIA_INGRESO_POLICIA_P40_2024-04-13_DEPOL_Ingreso.pdf

### Coleccion historica
- El Rincon del Policia (2021-2024): https://www.elrincondelpolicia.es/recopilacion-examenes-oficiales-oposicion-policia-nacional/

## IMPORTANTE: 3 opciones
Estos examenes tienen 3 opciones (A, B, C) no 4. El parser ya soporta esto
gracias a FASE 0. Verificar que parsed.json tiene `opciones` de 3 elementos.

## Que descargar para OpoRuta

1. Descarga examen P41 Modelo A → `2025/examen_modelo_a.pdf`
2. Descarga plantilla P41 Modelo A → `2025/plantilla_a.pdf`
3. Descarga examen P40 Modelo A → `2024/examen_modelo_a.pdf`
4. Descarga examen P40 Modelo B → `2024/examen_modelo_b.pdf`
5. Descarga plantillas P40 → `2024/plantilla_a.pdf`, `2024/plantilla_b.pdf`

## Comandos despues de descargar
```bash
cd optek
pnpm parse:examenes --dir examenes_policia_nacional 2025 A
pnpm parse:examenes --dir examenes_policia_nacional 2024 A
pnpm parse:examenes --dir examenes_policia_nacional 2024 B
pnpm ingest:examenes --dir examenes_policia_nacional --oposicion policia-nacional
```
