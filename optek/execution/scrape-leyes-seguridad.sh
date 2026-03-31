#!/bin/bash
# =============================================================================
# Scraping de leyes para rama Seguridad (Ertzaintza + GC + PN)
# Ejecutar desde el directorio optek/
#
# Uso: bash execution/scrape-leyes-seguridad.sh
# =============================================================================

set -e
echo "═══════════════════════════════════════════════════"
echo "  Scraping leyes Seguridad (9 leyes)"
echo "═══════════════════════════════════════════════════"

# ── 1. LO 2/1986 FCSE ──────────────────────────────────
echo ""
echo "▶ [1/9] LO 2/1986 Fuerzas y Cuerpos de Seguridad"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-1986-6859 \
  lo_2_1986_fcse.json \
  FCSE \
  "Ley Orgánica 2/1986, de 13 de marzo, de Fuerzas y Cuerpos de Seguridad"
sleep 2

# ── 2. LO 4/2015 Seguridad Ciudadana ───────────────────
echo ""
echo "▶ [2/9] LO 4/2015 Protección de la Seguridad Ciudadana"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-2015-3442 \
  lo_4_2015_seguridad_ciudadana.json \
  SEG_CIUDADANA \
  "Ley Orgánica 4/2015, de 30 de marzo, de protección de la seguridad ciudadana"
sleep 2

# ── 3. LO 10/1995 Código Penal ─────────────────────────
echo ""
echo "▶ [3/9] LO 10/1995 Código Penal (grande, ~600 arts)"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-1995-25444 \
  lo_10_1995_codigo_penal.json \
  CP \
  "Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal"
sleep 3

# ── 4. RDL 6/2015 Ley Seguridad Vial ───────────────────
echo ""
echo "▶ [4/9] RDL 6/2015 Ley sobre Tráfico y Seguridad Vial"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-2015-11722 \
  rdl_6_2015_seguridad_vial.json \
  LSV \
  "Real Decreto Legislativo 6/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley sobre Tráfico, Circulación de Vehículos a Motor y Seguridad Vial"
sleep 2

# ── 5. LO 3/1979 Estatuto de Gernika ───────────────────
echo ""
echo "▶ [5/9] LO 3/1979 Estatuto de Autonomía del País Vasco"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-1979-30177 \
  lo_3_1979_estatuto_gernika.json \
  ESTATUTO_GERNIKA \
  "Ley Orgánica 3/1979, de 18 de diciembre, de Estatuto de Autonomía para el País Vasco"
sleep 2

# ── 6. LO 9/1983 Derecho de Reunión ────────────────────
echo ""
echo "▶ [6/9] LO 9/1983 reguladora del Derecho de Reunión"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-1983-19946 \
  lo_9_1983_derecho_reunion.json \
  DERECHO_REUNION \
  "Ley Orgánica 9/1983, de 15 de julio, reguladora del derecho de reunión"
sleep 2

# ── 7. Ley 4/2015 Estatuto de la Víctima ───────────────
echo ""
echo "▶ [7/9] Ley 4/2015 del Estatuto de la víctima del delito"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-2015-4606 \
  ley_4_2015_estatuto_victima.json \
  ESTATUTO_VICTIMA \
  "Ley 4/2015, de 27 de abril, del Estatuto de la víctima del delito"
sleep 2

# ── 8. Ley 5/2014 Seguridad Privada ────────────────────
echo ""
echo "▶ [8/9] Ley 5/2014 de Seguridad Privada"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-2014-3649 \
  ley_5_2014_seguridad_privada.json \
  SEG_PRIVADA \
  "Ley 5/2014, de 4 de abril, de Seguridad Privada"
sleep 2

# ── 9. LO 4/2000 Extranjería ───────────────────────────
echo ""
echo "▶ [9/9] LO 4/2000 Derechos y libertades de los extranjeros"
npx tsx execution/scrape-boe-ley-v2.ts \
  BOE-A-2000-544 \
  lo_4_2000_extranjeria.json \
  LOEX \
  "Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Scraping completado. 9 leyes en data/legislacion/"
echo ""
echo "  Siguiente paso: pnpm ingest:legislacion"
echo "  Después: pnpm generate:embeddings"
echo "  Después: pnpm tag:legislacion --rama seguridad"
echo "═══════════════════════════════════════════════════"
