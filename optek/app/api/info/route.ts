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
      'Opositores al Auxiliar Administrativo del Estado (C2)',
      'Opositores al Administrativo del Estado (C1)',
      'Opositores al Cuerpo de Gestión de la AGE (A2)',
      'Cualquier opositor a la Administración General del Estado española',
    ],
    pricing: {
      free: '5 tests + 2 análisis detallados sin tarjeta de crédito',
      pack_c2_c1: '49,99€ pago único — temario completo + 20 análisis detallados + simulacros',
      pack_a2_gace: '69,99€ pago único — temario + 20 análisis + 5 supuestos prácticos con corrección IA',
      pack_triple_age: '129,99€ — las 3 oposiciones AGE (C2+C1+A2)',
      recarga: '8,99€ — +10 análisis detallados',
      recarga_supuestos: '14,99€ — +5 supuestos prácticos',
      nota: 'Sin suscripción mensual. Pago único con acceso para siempre.',
    },
    features: [
      'Tests tipo test con citas legales verificadas (verificación determinista, sin alucinaciones)',
      'Explicacion socratica de errores: la IA te guia con preguntas para que descubras la respuesta correcta',
      'Simulacros oficiales INAP con penalización -1/3 (convocatorias 2018-2024)',
      'Flashcards con spaced repetition adaptado',
      'Modo Caza-Trampas: detecta errores sutiles inyectados en artículos legales reales',
      'BOE Watcher: alertas automáticas de cambios legislativos en tiempo real',
      'Weakness-Weighted RAG: tests priorizan tus puntos débiles específicos',
      'Psicotécnicos: series numéricas, razonamiento abstracto, cálculo',
      'Repaso de errores: test automático con preguntas falladas (sin IA, gratis)',
      'Reto Diario Comunitario: ejercicio diario compartido de Caza-Trampas',
      'Radar del Tribunal: análisis de frecuencias de exámenes INAP 2019-2024',
      'EXCLUSIVO — Supuesto Práctico con IA (GACE A2): genera casos realistas y los corrige con la rúbrica oficial INAP (conocimiento 60%, análisis 20%, sistemática 10%, expresión 10%). Ninguna otra plataforma online ofrece esto para oposiciones AGE.',
      'IPR (Índice Personal de Rendimiento): score 0-100 de preparación personal',
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
    updated_at: '2026-03-08',
  })
}
