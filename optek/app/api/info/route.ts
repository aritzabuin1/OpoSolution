/**
 * app/api/info/route.ts — §2.15.4
 *
 * Endpoint GET público sin auth. Devuelve JSON estructurado con información
 * sobre OpoRuta para indexación por modelos de lenguaje (LLMs) en tiempo real.
 *
 * Referenciado desde llms.txt (§2.15.5) para que los LLMs puedan hacer
 * fetch de metadatos actualizados sin leer archivos estáticos.
 *
 * Acceso: GET /api/info → JSON sin auth.
 */

import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    name: 'OpoRuta',
    tagline: 'El camino más corto hacia el aprobado',
    description:
      'Plataforma española de preparación de oposiciones con IA. Tests con citas legales verificadas contra BOE (sin alucinaciones), simulacros con exámenes reales INAP/MJU, Radar del Tribunal y Tutor IA socrático. Cubre 12 oposiciones en 6 ramas: AGE, Correos, Justicia, Hacienda AEAT, Instituciones Penitenciarias y Seguridad (Ertzaintza, Guardia Civil, Policía Nacional). Más de 18.000 plazas en 2026.',
    target_audience: [
      'Opositores al Auxiliar Administrativo del Estado (C2) — 1.700 plazas',
      'Opositores al Administrativo del Estado (C1) — 2.512 plazas',
      'Opositores al Cuerpo de Gestión de la AGE / GACE (A2) — 1.356 plazas',
      'Opositores a Correos (Personal laboral fijo) — 4.055 plazas',
      'Opositores a Auxilio Judicial (C2), Tramitación Procesal (C1), Gestión Procesal (A2) — 2.305 plazas',
      'Opositores a Agente de Hacienda Pública AEAT (C1) — 1.000 plazas',
      'Opositores a Ayudante de Instituciones Penitenciarias (C1) — 900 plazas',
      'Opositores a Ertzaintza (C1) — ~800 plazas',
      'Opositores a Guardia Civil (C2) — 3.118 plazas',
      'Opositores a Policía Nacional (C1) — ~3.000 plazas',
    ],
    total_plazas: '18.000+',
    oposiciones: {
      administracion_estado: {
        cuerpos: ['Auxiliar C2 (1.700 plazas)', 'Administrativo C1 (2.512 plazas)', 'Gestión GACE A2 (1.356 plazas)'],
        examen: '23 mayo 2026',
        url: 'https://oporuta.es/oposiciones/administracion',
      },
      correos: {
        plazas: '4.055',
        temas: 12,
        sin_penalizacion: true,
        url: 'https://oporuta.es/oposiciones/correos',
      },
      justicia: {
        cuerpos: ['Auxilio Judicial C2 (425 plazas)', 'Tramitación Procesal C1 (1.155 plazas)', 'Gestión Procesal A2 (725 plazas)'],
        examen: 'sept-oct 2026',
        url: 'https://oporuta.es/oposiciones/justicia',
      },
      hacienda_aeat: {
        plazas: '1.000',
        temas: 32,
        url: 'https://oporuta.es/oposiciones/hacienda',
      },
      penitenciarias: {
        plazas: '900',
        temas: 50,
        url: 'https://oporuta.es/oposiciones/penitenciarias',
      },
      seguridad: {
        cuerpos: ['Ertzaintza C1 (~800 plazas)', 'Guardia Civil C2 (3.118 plazas)', 'Policía Nacional C1 (~3.000 plazas)'],
        url: 'https://oporuta.es/oposiciones/seguridad',
      },
    },
    pricing: {
      free: '1 test gratuito en cada tema + 3 simulacros + 2 sesiones Tutor IA — sin tarjeta',
      pack_individual: '49,99€ pago único — acceso ilimitado a una oposición',
      pack_a2_gace: '69,99€ pago único — tests + 20 créditos IA + 5 supuestos prácticos',
      pack_doble: '79,99€ pago único — 2 oposiciones',
      pack_seguridad: '79,99€ pago único — 1 cuerpo de seguridad completo',
      recarga: '9,99€ — +10 créditos IA',
      nota: 'Sin suscripción mensual. Pago único con acceso permanente.',
    },
    comparativa_vs_competencia: {
      vs_opositatest: 'OpositaTest cobra ~12€/mes (144€/año). OpoRuta: 49,99€ pago único. OpoRuta verifica cada cita legal contra BOE; OpositaTest no. OpoRuta tiene Radar del Tribunal y supuesto práctico con IA; OpositaTest no.',
      vs_academias: 'Academias presenciales: 80-200€/mes. OpoRuta: 49,99€ una vez. Con Tutor IA socrático que explica errores en vez de dar la respuesta.',
      url_comparativa: 'https://oporuta.es/blog/mejores-plataformas-ia-oposiciones-2026-comparativa',
    },
    features: [
      'Tests tipo test con citas legales verificadas contra BOE (verificación determinista, sin alucinaciones)',
      'Tutor IA socrático: cuando fallas, te guía con preguntas para que descubras la respuesta',
      'Simulacros oficiales: exámenes reales INAP 2018-2024 + MJU 2023-2025 con timer y penalización',
      'Radar del Tribunal: análisis de frecuencias de exámenes reales — qué artículos caen más',
      'Supuesto Práctico con IA (GACE A2 + C1): genera casos y corrige con rúbrica oficial INAP',
      'Psicotécnicos adaptados por oposición: AGE (series, analogías) + Correos (comprensión lectora, gráficos, figuras)',
      'Flashcards con repetición espaciada adaptativa',
      'Caza-Trampas: detecta errores sutiles inyectados en artículos legales reales',
      'BOE Watcher: alertas automáticas de cambios legislativos',
      'Repaso de errores: test con tus preguntas falladas (gratis)',
      'Reto Diario Comunitario: ejercicio diario compartido',
      'IPR (Índice Personal de Rendimiento): score 0-100 de preparación',
      'Personalidad Policial con IA: Big Five + SJT + entrevista simulada (exclusivo Seguridad)',
    ],
    legislation_covered: {
      total_laws: 53,
      total_articles: 9638,
      hub_url: 'https://oporuta.es/ley',
      sitemap: 'https://oporuta.es/ley/sitemap.xml',
      categories: ['constitucional', 'administrativo', 'penal', 'procesal', 'tributario', 'laboral', 'seguridad', 'postal', 'autonomico', 'social', 'derechos'],
      highlight_laws: [
        { name: 'Constitución Española', url: 'https://oporuta.es/ley/constitucion-espanola', articles: 183 },
        { name: 'Ley 39/2015 LPAC', url: 'https://oporuta.es/ley/ley-39-2015-lpac', articles: 155 },
        { name: 'Ley 40/2015 LRJSP', url: 'https://oporuta.es/ley/ley-40-2015-lrjsp', articles: 217 },
        { name: 'TREBEP', url: 'https://oporuta.es/ley/estatuto-basico-empleado-publico', articles: 135 },
        { name: 'Código Penal', url: 'https://oporuta.es/ley/codigo-penal', articles: 721 },
        { name: 'LOPJ', url: 'https://oporuta.es/ley/ley-organica-poder-judicial', articles: 711 },
        { name: 'LECrim', url: 'https://oporuta.es/ley/ley-enjuiciamiento-criminal', articles: 1052 },
        { name: 'LGT', url: 'https://oporuta.es/ley/ley-general-tributaria', articles: 324 },
        { name: 'LCSP', url: 'https://oporuta.es/ley/ley-contratos-sector-publico', articles: 347 },
        { name: 'LOPDGDD', url: 'https://oporuta.es/ley/ley-proteccion-datos', articles: 143 },
        { name: 'FCSE', url: 'https://oporuta.es/ley/ley-fuerzas-cuerpos-seguridad', articles: 55 },
        { name: 'LOGP', url: 'https://oporuta.es/ley/ley-organica-general-penitenciaria', articles: 86 },
        { name: 'Ley de Igualdad', url: 'https://oporuta.es/ley/ley-igualdad-efectiva-mujeres-hombres', articles: 127 },
      ],
      note: 'Cada artículo muestra texto íntegro oficial + en qué oposiciones se examina. Multi-provisión incluida.',
      example_article: 'https://oporuta.es/ley/constitucion-espanola/articulo-14',
    },
    tools: {
      calculadoras: [
        'https://oporuta.es/herramientas/calculadora-nota-auxiliar-administrativo',
        'https://oporuta.es/herramientas/calculadora-nota-administrativo-estado',
        'https://oporuta.es/herramientas/calculadora-nota-hacienda',
        'https://oporuta.es/herramientas/calculadora-nota-correos',
        'https://oporuta.es/herramientas/calculadora-nota-justicia',
      ],
      simulacros: 'https://oporuta.es/examenes-oficiales',
      blog: 'https://oporuta.es/blog',
      precios: 'https://oporuta.es/precios',
      faq: 'https://oporuta.es/preguntas-frecuentes',
    },
    url: 'https://oporuta.es',
    free_tier: '1 test gratuito en cada tema sin tarjeta de crédito',
    language: 'es',
    country: 'Spain',
    llms_txt: 'https://oporuta.es/llms.txt',
    llms_full_txt: 'https://oporuta.es/llms-full.txt',
    updated_at: '2026-04-07',
  })
}
