#!/bin/bash
# =============================================================================
# Scraping de leyes BOPV (publicadas tambien en BOE) para Ertzaintza
# Ejecutar desde el directorio optek/
#
# Uso: bash execution/scrape-leyes-bopv.sh
# =============================================================================

set -e
echo "═══════════════════════════════════════════════════"
echo "  Scraping leyes BOPV (via BOE) para Ertzaintza"
echo "═══════════════════════════════════════════════════"

# ── 1. DL 1/2023 Igualdad CAV ──────────────────────────
echo ""
echo "▶ [1/3] DL 1/2023 Igualdad Mujeres y Hombres CAV"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-2023-9168 \
  dl_1_2023_igualdad_cav.json \
  DL_IGUALDAD_CAV \
  "Decreto Legislativo 1/2023, de 16 de marzo, por el que se aprueba el texto refundido de la Ley para la Igualdad de Mujeres y Hombres y Vidas Libres de Violencia Machista contra las Mujeres"
sleep 2

# ── 2. DL 1/2020 Policía del País Vasco ────────────────
echo ""
echo "▶ [2/3] DL 1/2020 Ley de Policía del País Vasco"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-2020-9740 \
  dl_1_2020_policia_pv.json \
  DL_POLICIA_PV \
  "Decreto Legislativo 1/2020, de 22 de julio, por el que se aprueba el texto refundido de la Ley de Policía del País Vasco"
sleep 2

# ── 3. Ley 15/2012 Seguridad Publica Euskadi ───────────
echo ""
echo "▶ [3/3] Ley 15/2012 Ordenación Sistema Seguridad Publica Euskadi"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-2012-9665 \
  ley_15_2012_seguridad_euskadi.json \
  LEY_SEG_EUSKADI \
  "Ley 15/2012, de 28 de junio, de Ordenación del Sistema de Seguridad Pública de Euskadi"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Scraping completado. 3 leyes BOPV en data/legislacion/"
echo "═══════════════════════════════════════════════════"
