-- =============================================================================
-- Migration 048: Oposición Correos (Personal Laboral Fijo, Grupo IV)
-- Autor: Claude / Aritz | Fecha: 2026-03-25
--
-- Temario oficial verificado contra 8+ fuentes independientes (2023 convocatoria).
-- Scoring: 100 preguntas, 110 min, +0.60/-0, NO penaliza.
-- Concurso-oposición: examen 60pts + méritos 40pts.
-- =============================================================================

-- ─── Oposición ─────────────────────────────────────────────────────────────────

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'Correos — Personal Laboral Fijo (Grupo IV)',
  'correos',
  'Oposiciones Correos: Reparto, Agente de Clasificación y Atención al Cliente. 12 temas, sin penalización, +4.000 plazas.',
  12,
  false,  -- Se activa cuando el contenido esté listo
  '{"psicotecnicos": true, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}'::jsonb,
  'correos',
  'IV',
  1,
  4000,
  '2026-06-15',  -- Estimación (convocatoria aún no publicada)
  '{
    "ejercicios": [{
      "nombre": "Test",
      "preguntas": 100,
      "preguntas_temario": 90,
      "preguntas_psicotecnicos": 10,
      "reserva": 0,
      "minutos": 110,
      "acierto": 0.60,
      "error": 0,
      "max": 60,
      "min_aprobado": null,
      "penaliza": false
    }],
    "sistema": "concurso-oposicion",
    "meritos_max": 40
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  slug = EXCLUDED.slug,
  descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas,
  features = EXCLUDED.features,
  rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel,
  orden = EXCLUDED.orden,
  plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox,
  scoring_config = EXCLUDED.scoring_config;

-- ─── 12 Temas (temario oficial 2023, verificado) ──────────────────────────────

INSERT INTO temas (oposicion_id, numero, titulo, descripcion) VALUES
  ('d0000000-0000-0000-0000-000000000001', 1,
   'Marco normativo postal y naturaleza jurídica',
   'Correos: marco normativo postal y naturaleza jurídica. Organismos reguladores nacionales e internacionales. Organizaciones postales internacionales. Organización del Grupo Correos.'),

  ('d0000000-0000-0000-0000-000000000001', 2,
   'Experiencia de personas en Correos',
   'Diversidad, Inclusión e Igualdad. Prevención de riesgos y bienestar. RSC. ODS. Sostenibilidad. Emprendimiento e Innovación.'),

  ('d0000000-0000-0000-0000-000000000001', 3,
   'Paquetería de Correos y Correos Express',
   'Servicios e-commerce y Citypaq.'),

  ('d0000000-0000-0000-0000-000000000001', 4,
   'Productos y servicios en Oficinas',
   'Servicios Financieros. Soluciones Digitales. Filatelia.'),

  ('d0000000-0000-0000-0000-000000000001', 5,
   'Nuevas líneas de negocio',
   'Correos Logística. Correos Frío. Otros negocios.'),

  ('d0000000-0000-0000-0000-000000000001', 6,
   'Herramientas',
   'Funciones y utilidad. IRIS, SGIE, PDA, SICER y otras herramientas operativas.'),

  ('d0000000-0000-0000-0000-000000000001', 7,
   'Procesos operativos I: Admisión',
   'Etiquetado, franqueo, facturación, requisitos de envíos.'),

  ('d0000000-0000-0000-0000-000000000001', 8,
   'Procesos operativos II: Tratamiento y Transporte',
   'Centros de tratamiento automatizado (CTA). Clasificación y rutas.'),

  ('d0000000-0000-0000-0000-000000000001', 9,
   'Procesos operativos III: Distribución y Entrega',
   'RD 437/2024. Normas de entrega, avisos de llegada, buzones.'),

  ('d0000000-0000-0000-0000-000000000001', 10,
   'El cliente: Atención al cliente y calidad',
   'Reclamaciones. KPIs. Protocolos de Ventas. Plan de calidad.'),

  ('d0000000-0000-0000-0000-000000000001', 11,
   'Internacionalización y Aduanas',
   'UPU. Envíos internacionales. Procedimientos aduaneros.'),

  ('d0000000-0000-0000-0000-000000000001', 12,
   'Normas de cumplimiento',
   'Protección de datos (RGPD, LOPDGDD). Prevención de Blanqueo de Capitales. Compromiso ético y transparencia. Seguridad de la Información y Ciberseguridad.')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descripcion = EXCLUDED.descripcion;
