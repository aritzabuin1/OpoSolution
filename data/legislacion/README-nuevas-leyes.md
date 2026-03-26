# Leyes pendientes de ingesta — Correos + Justicia

## Correos (rama: correos)
Las siguientes leyes necesitan scraping del BOE e ingesta:

| Ley | Código | Prioridad | Temas que cubre |
|-----|--------|-----------|-----------------|
| Ley 43/2010 del servicio postal universal | LEY_POSTAL | ALTA | T1, T3 |
| RD 1829/1999 Reglamento servicios postales | RD_POSTAL | ALTA | T1, T6, T7, T8 |
| RGPD (Reglamento UE 2016/679) | RGPD | MEDIA | T12 |
| LOPDGDD (ya existe para AGE) | LOPDGDD | YA INGESTA | T12 |
| LO 3/2007 Igualdad (ya existe para AGE) | LO_IGUALDAD | YA INGESTA | T10 |
| Ley 31/1995 PRL (ya existe para AGE) | PRL | YA INGESTA | T10 |
| Ley 6/2020 firma electrónica | LEY_FIRMA_E | MEDIA | T11 |

## Justicia (rama: justicia)
Las siguientes leyes necesitan scraping del BOE e ingesta:

| Ley | Código | Prioridad | Temas que cubre |
|-----|--------|-----------|-----------------|
| Constitución Española (ya existe) | CE | YA INGESTA | T1-T5 |
| LO 1/2025 Servicio Público de Justicia | LO_SPJ | CRÍTICA | T4-T16 (sustituye LOPJ en parte) |
| LO 6/1985 LOPJ (consolidada con LO 1/2025) | LOPJ | ALTA | T4-T16 |
| Ley 1/2000 LEC | LEC | ALTA | T15-T19, T23-T34 |
| RD 14/09/1882 LECrim | LECRIM | ALTA | T16, T20-T23, T35-T45 |
| RDL 5/2015 TREBEP (ya existe) | TREBEP | YA INGESTA | T11-T13, T17-T22 |
| LO 3/2007 Igualdad (ya existe) | LO_IGUALDAD | YA INGESTA | T24, T33, T64 |
| LO 1/2004 VG (ya existe) | LO_VG | YA INGESTA | T24, T34, T65 |
| Ley 15/2022 igualdad trato | LEY_IGUALDAD_TRATO | MEDIA | T35, T66 |
| Ley 4/2023 LGTBI (ya existe) | LGTBI | YA INGESTA | T35, T66 |
| Ley 39/2015 LPAC (ya existe) | LPAC | YA INGESTA | T31, T58 |
| Ley 9/2017 LCSP (ya existe) | LCSP | YA INGESTA | T32, T60 |
| Ley 31/1995 PRL (ya existe) | PRL | YA INGESTA | T25, T36, T67 |
| LOPDGDD (ya existe) | LOPDGDD | YA INGESTA | T26, T37, T68 |

## Proceso de ingesta
1. Scrape del BOE consolidado (usar `execution/scrape-boe.ts` si existe, o crear)
2. Guardar como JSON en `data/legislacion/` siguiendo el formato existente
3. Ejecutar `pnpm ingest:legislacion`
4. Ejecutar tagging de tema_ids (segundo script)

## Leyes ya disponibles (reutilizables para Justicia)
La mayoría de las leyes transversales (CE, TREBEP, LPAC, LOPDGDD, PRL, Igualdad) ya están
ingestionadas para AGE. Solo necesitan re-tagging con los tema_ids de Justicia.
