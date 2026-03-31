# Examenes Oficiales — Policia Nacional (Escala Basica)

## Formato
- 100 preguntas, SIN reserva
- 3 opciones (A, B, C) — UNICO en la plataforma
- Penalizacion: 1/2
- Tiempo: 50 minutos

## Fuentes verificadas (marzo 2026)

### 2025 (Promocion 41)
- Jurispol: https://blog.jurispol.com/examen-escala-basica-promocion-41/
- Centro Pol (marzo 2025): https://academiacentropolicianacional.es/examen-policia-nacional-escala-basica-descarga-gratuita/

### 2024 (Promocion 40, 13 abril)
- OPN: https://oposicionespolicianacional.com/recurso/examen-ingreso-escala-basica-xl-promocion-40-2024/
- Centropol (modelo B + plantillas A y B): https://academiacentropol.com/descarga-el-examen-oficial-conocimientos-modelo-b-y-plantillas-modelo-a-y-modelo-b-examen-13-abril-policia-nacional-eb40/
- DEPOL (PDF directo): https://de-pol.es/wp-content/uploads/2025/03/EXAMEN_TEORIA_INGRESO_POLICIA_P41_A_2025-03-01_DEPOL_Ingreso.pdf

### Coleccion 2021-2024
- El Rincon del Policia: https://www.elrincondelpolicia.es/recopilacion-examenes-oficiales-oposicion-policia-nacional/
- Academia UFP Sevilla: https://academiaufpsevilla.com/descarga-gratis-los-examenes-oficiales-de-la-policia-nacional/

### Oficial
- Policia.es: https://www.policia.es/_es/oposiciones.php

## IMPORTANTE: 3 opciones
Al parsear estos examenes, verificar que el parser maneja correctamente
3 opciones (A, B, C) en lugar de 4. El soporte ya esta implementado en FASE 0.

## Instrucciones
1. Descargar PDF del examen y plantilla de respuestas
2. Guardar como `YYYY/examen.pdf` y `YYYY/plantilla.pdf` (o modelo_a/modelo_b)
3. Ejecutar: `pnpm parse:examenes --dir examenes_policia_nacional YYYY`
4. Ingestar: `pnpm ingest:examenes --oposicion policia-nacional`
