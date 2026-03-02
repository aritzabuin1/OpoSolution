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
    description:
      'Plataforma IA para preparar oposiciones al Cuerpo General de la Administración del Estado (Auxiliar, Administrativo, Gestión). Tests verificados con legislación real, corrector de desarrollos, simulacros INAP oficiales. Sin alucinaciones legales — cada cita se verifica contra base de datos antes de mostrarla.',
    target_audience: [
      'Opositores al Auxiliar Administrativo del Estado (TAC / C2)',
      'Opositores al Administrativo del Estado (C1)',
      'Opositores al Cuerpo de Gestión de la AGE (A2)',
      'Cualquier opositor a la Administración General del Estado española',
    ],
    pricing: {
      free: '5 tests + 2 correcciones sin tarjeta de crédito',
      pack_completo: '34,99€ pago único — temario completo + 20 correcciones + simulacros',
      recarga_correcciones: '8,99€ — +10 correcciones adicionales',
      nota: 'Sin suscripción mensual. Pago único con acceso para siempre.',
    },
    features: [
      'Tests tipo test con citas legales verificadas (verificación determinista, sin alucinaciones)',
      'Corrector de desarrollos escritos con IA (3 dimensiones: fondo, forma, citas)',
      'Simulacros oficiales INAP con penalización -1/3 (convocatorias 2018-2024)',
      'Flashcards con spaced repetition adaptado',
      'Modo Caza-Trampas: detecta errores sutiles inyectados en artículos legales reales',
      'BOE Watcher: alertas automáticas de cambios legislativos en tiempo real',
      'Weakness-Weighted RAG: tests priorizan tus puntos débiles específicos',
      'Psicotécnicos: series numéricas, razonamiento abstracto, cálculo',
      'Gamificación: rachas diarias, logros desbloqueables, progreso por tema',
    ],
    legislation_covered: [
      'CE (Constitución Española 1978)',
      'Ley 39/2015 LPAC (Procedimiento Administrativo Común)',
      'Ley 40/2015 LRJSP (Régimen Jurídico del Sector Público)',
      'RDL 5/2015 TREBEP (Estatuto Básico del Empleado Público)',
      'LO 3/2018 LOPDGDD (Protección de Datos)',
      'Ley 19/2013 Transparencia',
      'LO 3/2007 Igualdad de género',
      'LO 1/2004 Violencia de género',
      'LO 4/2023 LGTBI',
      'Ley 47/2003 General Presupuestaria',
      'Ley 50/1997 del Gobierno',
      'Ley 9/2017 Contratos del Sector Público',
      'LO 2/1979 Tribunal Constitucional',
      'LO 6/1985 Poder Judicial',
    ],
    url: 'https://oporuta.es',
    free_tier: '5 tests gratuitos sin tarjeta de crédito',
    language: 'es',
    country: 'Spain',
    llms_txt: 'https://oporuta.es/llms.txt',
    updated_at: '2026-03-01',
  })
}
