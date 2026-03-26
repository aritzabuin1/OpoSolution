#!/bin/bash
# =============================================================================
# Scraping de leyes nuevas para Correos + Justicia
# Ejecutar desde el directorio optek/
#
# Requisitos: Node.js + tsx instalado
# Uso: bash execution/scrape-leyes-nuevas.sh
# =============================================================================

set -e
echo "═══════════════════════════════════════════════════"
echo "  Scraping leyes Correos + Justicia"
echo "═══════════════════════════════════════════════════"

# ── Correos ──────────────────────────────────────────
echo ""
echo "▶ [CORREOS] Ley 43/2010 del servicio postal universal"
npx tsx execution/scrape-boe-ley.ts \
  "es/l/2010/12/29/43" \
  ley_43_2010_postal.json \
  LEY_POSTAL \
  "Ley 43/2010, de 30 de diciembre, del servicio postal universal, de los derechos de los usuarios y del mercado postal"

echo ""
echo "▶ [CORREOS] RD 1829/1999 Reglamento servicios postales"
npx tsx execution/scrape-boe-ley.ts \
  "es/rd/1999/12/03/1829" \
  rd_1829_1999_reglamento_postal.json \
  RD_POSTAL \
  "Real Decreto 1829/1999, de 3 de diciembre, por el que se aprueba el Reglamento por el que se regula la prestación de los servicios postales"

# ── Justicia ─────────────────────────────────────────
echo ""
echo "▶ [JUSTICIA] LO 1/2025 Servicio Público de Justicia"
npx tsx execution/scrape-boe-ley.ts \
  "es/lo/2025/01/02/1" \
  lo_1_2025_servicio_justicia.json \
  LO_SPJ \
  "Ley Orgánica 1/2025, de 2 de enero, de medidas en materia de eficiencia del Servicio Público de Justicia"

echo ""
echo "▶ [JUSTICIA] LOPJ LO 6/1985 (consolidada)"
npx tsx execution/scrape-boe-ley.ts \
  "es/lo/1985/07/01/6" \
  lo_6_1985_lopj.json \
  LOPJ \
  "Ley Orgánica 6/1985, de 1 de julio, del Poder Judicial"

echo ""
echo "▶ [JUSTICIA] LEC Ley 1/2000 Enjuiciamiento Civil"
npx tsx execution/scrape-boe-ley.ts \
  "es/l/2000/01/07/1" \
  ley_1_2000_lec.json \
  LEC \
  "Ley 1/2000, de 7 de enero, de Enjuiciamiento Civil"

echo ""
echo "▶ [JUSTICIA] LECrim RD 14/09/1882"
npx tsx execution/scrape-boe-ley.ts \
  "es/rd/1882/09/14/(1)" \
  lecrim_1882.json \
  LECRIM \
  "Real decreto de 14 de septiembre de 1882 por el que se aprueba la Ley de Enjuiciamiento Criminal"

echo ""
echo "▶ [JUSTICIA] Ley 15/2022 igualdad de trato y no discriminación"
npx tsx execution/scrape-boe-ley.ts \
  "es/l/2022/07/12/15" \
  ley_15_2022_igualdad_trato.json \
  LEY_IGUALDAD_TRATO \
  "Ley 15/2022, de 12 de julio, integral para la igualdad de trato y la no discriminación"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Scraping completado. Archivos en data/legislacion/"
echo ""
echo "  Siguiente paso: pnpm ingest:legislacion"
echo "  Después: pnpm tag:legislacion --rama correos"
echo "  Después: pnpm tag:legislacion --rama justicia"
echo "═══════════════════════════════════════════════════"
