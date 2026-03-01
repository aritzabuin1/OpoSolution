/**
 * execution/setup-test-environment.ts
 *
 * Script que configura el entorno de pruebas completo:
 *   1. Upsert de la oposición (Auxiliar Administrativo del Estado)
 *   2. Upsert de los 28 temas oficiales (convocatoria 2025-2026)
 *   3. Seed de 16 artículos legislativos clave (CE + LPAC + EBEP)
 *   4. Crear usuario de prueba: test@optek.dev
 *   5. Configurar perfil: oposicion_id + saldo extra para testing
 *
 * Uso:
 *   npx tsx execution/setup-test-environment.ts
 *
 * Idempotente: ejecutar N veces no duplica datos.
 */

import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TEST_EMAIL = 'test@optek.dev'
const TEST_PASSWORD = 'Optek2025!'

const OPOSICION_ID = 'a0000000-0000-0000-0000-000000000001'

// ─── Datos ───────────────────────────────────────────────────────────────────

const TEMAS = [
  // Bloque I: Organización Pública (1-16)
  { id: 'b0000000-0000-0000-0001-000000000001', numero: 1, titulo: 'La Constitución Española de 1978', descripcion: 'Estructura y contenido. Principios fundamentales. Derechos y deberes fundamentales. Garantías constitucionales. Reforma constitucional.' },
  { id: 'b0000000-0000-0000-0001-000000000002', numero: 2, titulo: 'El Tribunal Constitucional y la reforma constitucional', descripcion: 'El Tribunal Constitucional: composición, organización y atribuciones. El procedimiento de reforma de la Constitución.' },
  { id: 'b0000000-0000-0000-0001-000000000003', numero: 3, titulo: 'Las Cortes Generales', descripcion: 'El Congreso de los Diputados y el Senado: composición, atribuciones y funcionamiento. El estatuto de los parlamentarios.' },
  { id: 'b0000000-0000-0000-0001-000000000004', numero: 4, titulo: 'El Poder Judicial', descripcion: 'La organización judicial española. El Consejo General del Poder Judicial. El Ministerio Fiscal.' },
  { id: 'b0000000-0000-0000-0001-000000000005', numero: 5, titulo: 'El Gobierno y la Administración', descripcion: 'El Gobierno: composición, nombramiento y cese. Funciones del Presidente del Gobierno. Relaciones Gobierno-Cortes.' },
  { id: 'b0000000-0000-0000-0001-000000000006', numero: 6, titulo: 'Gobierno Abierto', descripcion: 'Concepto y principios del Gobierno Abierto. Participación ciudadana. Datos abiertos. Rendición de cuentas.' },
  { id: 'b0000000-0000-0000-0001-000000000007', numero: 7, titulo: 'La Transparencia y el buen gobierno', descripcion: 'Ley 19/2013, de transparencia, acceso a la información pública y buen gobierno. El Portal de la Transparencia. El Consejo de Transparencia.' },
  { id: 'b0000000-0000-0000-0001-000000000008', numero: 8, titulo: 'La Administración General del Estado', descripcion: 'Organización central: Ministerios, Secretarías de Estado, Subsecretarías. Organización periférica: Delegados del Gobierno. Administración en el exterior.' },
  { id: 'b0000000-0000-0000-0001-000000000009', numero: 9, titulo: 'La organización territorial del Estado', descripcion: 'Las Comunidades Autónomas: estatutos y competencias. La Administración Local: municipios, provincias e islas. Los principios de autonomía local.' },
  { id: 'b0000000-0000-0000-0001-000000000010', numero: 10, titulo: 'La Unión Europea: instituciones', descripcion: 'Parlamento Europeo, Consejo de la UE, Comisión Europea, Tribunal de Justicia, Banco Central Europeo. El Derecho Comunitario y su primacía.' },
  { id: 'b0000000-0000-0000-0001-000000000011', numero: 11, titulo: 'El procedimiento administrativo común (LPAC/LRJSP)', descripcion: 'Ley 39/2015 y Ley 40/2015: ámbito de aplicación, interesados, derechos, plazos, actos administrativos, notificaciones, recursos, silencio administrativo.' },
  { id: 'b0000000-0000-0000-0001-000000000012', numero: 12, titulo: 'La protección de datos personales', descripcion: 'RGPD (Reglamento UE 2016/679) y LOPDGDD (LO 3/2018): principios, derechos de los interesados, obligaciones del responsable del tratamiento, la AEPD.' },
  { id: 'b0000000-0000-0000-0001-000000000013', numero: 13, titulo: 'El personal funcionario: el TREBEP', descripcion: 'Real Decreto Legislativo 5/2015 (TREBEP): clases de empleados públicos, acceso a la función pública, carrera profesional, situaciones administrativas.' },
  { id: 'b0000000-0000-0000-0001-000000000014', numero: 14, titulo: 'Derechos y deberes de los empleados públicos', descripcion: 'Derechos individuales y colectivos. Código de conducta: principios éticos. Régimen de incompatibilidades. Régimen disciplinario: faltas y sanciones.' },
  { id: 'b0000000-0000-0000-0001-000000000015', numero: 15, titulo: 'El Presupuesto del Estado', descripcion: 'Ley General Presupuestaria (Ley 47/2003): concepto y principios. Elaboración, aprobación y ejecución. Control interno (IGAE) y externo (Tribunal de Cuentas).' },
  { id: 'b0000000-0000-0000-0001-000000000016', numero: 16, titulo: 'Políticas de igualdad: LGTBI', descripcion: 'Ley 4/2023, para la igualdad real y efectiva de las personas trans y para la garantía de los derechos de las personas LGTBI. Planes de igualdad.' },
  // Bloque II: Actividad Administrativa y Ofimática (17-28)
  { id: 'b0000000-0000-0000-0002-000000000001', numero: 17, titulo: 'La atención al público', descripcion: 'Técnicas de comunicación oral y escrita. Atención al ciudadano: principios y derechos. Quejas y sugerencias. Accesibilidad.' },
  { id: 'b0000000-0000-0000-0002-000000000002', numero: 18, titulo: 'Los servicios de información administrativa', descripcion: 'La información administrativa: tipos y canales. Las oficinas de información y atención al ciudadano. El punto de acceso general (PAGe). La Carpeta Ciudadana.' },
  { id: 'b0000000-0000-0000-0002-000000000003', numero: 19, titulo: 'El documento, el registro y el archivo', descripcion: 'El documento administrativo: concepto y clases. El registro: concepto y clases. El archivo: tipos y gestión documental. Transferencias y expurgo.' },
  { id: 'b0000000-0000-0000-0002-000000000004', numero: 20, titulo: 'La Administración Electrónica', descripcion: 'La sede electrónica. El registro electrónico. La notificación electrónica. El DNI electrónico y la firma digital. Cl@ve: sistemas de identificación.' },
  { id: 'b0000000-0000-0000-0002-000000000005', numero: 21, titulo: 'La Informática básica', descripcion: 'Conceptos básicos de hardware y software. Sistemas operativos. Redes: Internet, intranet, correo electrónico. Seguridad informática básica.' },
  { id: 'b0000000-0000-0000-0002-000000000006', numero: 22, titulo: 'Windows 11 y Copilot', descripcion: 'Características de Windows 11. Configuración del sistema. Copilot en Windows: funcionalidades e integración. Accesibilidad en Windows 11.' },
  { id: 'b0000000-0000-0000-0002-000000000007', numero: 23, titulo: 'El Explorador de Windows', descripcion: 'Gestión de archivos y carpetas. Operaciones básicas: copiar, mover, eliminar, buscar. Propiedades de archivos. Carpetas especiales. Compresión de archivos.' },
  { id: 'b0000000-0000-0000-0002-000000000008', numero: 24, titulo: 'Microsoft Word 365', descripcion: 'Edición y formato de documentos. Estilos y plantillas. Tablas e imágenes. Revisión ortográfica. Combinar correspondencia. Compartir y exportar documentos.' },
  { id: 'b0000000-0000-0000-0002-000000000009', numero: 25, titulo: 'Microsoft Excel 365', descripcion: 'Hojas de cálculo: conceptos básicos. Fórmulas y funciones. Formato condicional. Gráficos. Tablas dinámicas. Filtros y ordenación.' },
  { id: 'b0000000-0000-0000-0002-000000000010', numero: 26, titulo: 'Microsoft Access 365', descripcion: 'Bases de datos relacionales: conceptos. Tablas, consultas, formularios e informes. Relaciones entre tablas. Importar y exportar datos.' },
  { id: 'b0000000-0000-0000-0002-000000000011', numero: 27, titulo: 'Microsoft Outlook 365', descripcion: 'Correo electrónico: redacción, respuesta y organización. Contactos y grupos. Calendario y tareas. Reglas y categorías. Configuración de cuentas.' },
  { id: 'b0000000-0000-0000-0002-000000000012', numero: 28, titulo: 'La Red Internet', descripcion: 'Conceptos básicos de Internet: protocolos, navegadores, URL. Buscadores y estrategias de búsqueda. Seguridad en Internet: phishing, malware. Servicios en la nube.' },
]

const LEGISLACION = [
  // CE
  { id: 'c0000000-0000-0000-0001-000000000001', ley_nombre: 'CE', ley_nombre_completo: 'Constitución Española de 1978', ley_codigo: 'CE', articulo_numero: '1', apartado: null, titulo_capitulo: 'Título Preliminar', texto_integro: 'España se constituye en un Estado social y democrático de Derecho, que propugna como valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político.\nLa soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado.\nLa forma política del Estado español es la Monarquía parlamentaria.', tema_ids: ['b0000000-0000-0000-0001-000000000001'] },
  { id: 'c0000000-0000-0000-0001-000000000002', ley_nombre: 'CE', ley_nombre_completo: 'Constitución Española de 1978', ley_codigo: 'CE', articulo_numero: '9', apartado: '3', titulo_capitulo: 'Título Preliminar', texto_integro: 'La Constitución garantiza el principio de legalidad, la jerarquía normativa, la publicidad de las normas, la irretroactividad de las disposiciones sancionadoras no favorables o restrictivas de derechos individuales, la seguridad jurídica, la responsabilidad y la interdicción de la arbitrariedad de los poderes públicos.', tema_ids: ['b0000000-0000-0000-0001-000000000001'] },
  { id: 'c0000000-0000-0000-0001-000000000003', ley_nombre: 'CE', ley_nombre_completo: 'Constitución Española de 1978', ley_codigo: 'CE', articulo_numero: '14', apartado: null, titulo_capitulo: 'Título I - Capítulo II: Derechos y libertades', texto_integro: 'Los españoles son iguales ante la ley, sin que pueda prevalecer discriminación alguna por razón de nacimiento, raza, sexo, religión, opinión o cualquier otra condición o circunstancia personal o social.', tema_ids: ['b0000000-0000-0000-0001-000000000001'] },
  { id: 'c0000000-0000-0000-0001-000000000004', ley_nombre: 'CE', ley_nombre_completo: 'Constitución Española de 1978', ley_codigo: 'CE', articulo_numero: '23', apartado: null, titulo_capitulo: 'Título I - Capítulo II: Derechos y libertades', texto_integro: 'Los ciudadanos tienen el derecho a participar en los asuntos públicos, directamente o por medio de representantes, libremente elegidos en elecciones periódicas por sufragio universal.\nAsimismo, tienen derecho a acceder en condiciones de igualdad a las funciones y cargos públicos, con los requisitos que señalen las leyes.', tema_ids: ['b0000000-0000-0000-0001-000000000001'] },
  { id: 'c0000000-0000-0000-0001-000000000005', ley_nombre: 'CE', ley_nombre_completo: 'Constitución Española de 1978', ley_codigo: 'CE', articulo_numero: '103', apartado: null, titulo_capitulo: 'Título IV: Del Gobierno y de la Administración', texto_integro: 'La Administración Pública sirve con objetividad los intereses generales y actúa de acuerdo con los principios de eficacia, jerarquía, descentralización, desconcentración y coordinación, con sometimiento pleno a la ley y al Derecho.\nLos órganos de la Administración del Estado son creados, regidos y coordinados de acuerdo con la ley.\nLa ley regulará el estatuto de los funcionarios públicos, el acceso a la función pública de acuerdo con los principios de mérito y capacidad, las peculiaridades del ejercicio de su derecho a sindicación, el sistema de incompatibilidades y las garantías para la imparcialidad en el ejercicio de sus funciones.', tema_ids: ['b0000000-0000-0000-0001-000000000005', 'b0000000-0000-0000-0001-000000000013'] },
  // LPAC
  { id: 'c0000000-0000-0000-0001-000000000006', ley_nombre: 'LPAC', ley_nombre_completo: 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', ley_codigo: 'LPAC', articulo_numero: '21', apartado: null, titulo_capitulo: 'Título III - Capítulo I: Normas generales', texto_integro: 'La Administración está obligada a dictar resolución expresa y a notificarla en todos los procedimientos cualquiera que sea su forma de iniciación.\nEl plazo máximo en el que debe notificarse la resolución expresa será el fijado por la norma reguladora del correspondiente procedimiento. Este plazo no podrá exceder de seis meses salvo que una norma con rango de Ley establezca uno mayor o así venga previsto en el Derecho de la Unión Europea.', tema_ids: ['b0000000-0000-0000-0001-000000000011'] },
  { id: 'c0000000-0000-0000-0001-000000000007', ley_nombre: 'LPAC', ley_nombre_completo: 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', ley_codigo: 'LPAC', articulo_numero: '53', apartado: null, titulo_capitulo: 'Título IV - Capítulo I: Derechos de las personas', texto_integro: 'Los interesados en un procedimiento administrativo tienen los siguientes derechos:\na) A conocer, en cualquier momento, el estado de la tramitación de los procedimientos en los que tengan la condición de interesados; el sentido del silencio administrativo que corresponda en caso de que la Administración no dicte ni notifique resolución expresa en plazo.\nb) A identificar a las autoridades y al personal al servicio de las Administraciones Públicas bajo cuya responsabilidad se tramiten los procedimientos.\nc) A no presentar documentos originales salvo que, de manera excepcional, la normativa reguladora aplicable establezca lo contrario.\nd) A no presentar datos y documentos no exigidos por las normas aplicables al procedimiento de que se trate.', tema_ids: ['b0000000-0000-0000-0001-000000000011'] },
  { id: 'c0000000-0000-0000-0001-000000000008', ley_nombre: 'LPAC', ley_nombre_completo: 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', ley_codigo: 'LPAC', articulo_numero: '54', apartado: null, titulo_capitulo: 'Título IV - Capítulo I', texto_integro: 'La Administración está obligada a dictar resolución expresa en todos los procedimientos y a notificarla cualquiera que sea su forma de iniciación.\nSe exceptúan de la obligación a que se refiere el párrafo primero los supuestos de terminación del procedimiento por pacto o convenio, así como los procedimientos relativos al ejercicio de derechos sometidos únicamente al deber de comunicación previa a la Administración.', tema_ids: ['b0000000-0000-0000-0001-000000000011'] },
  { id: 'c0000000-0000-0000-0001-000000000009', ley_nombre: 'LPAC', ley_nombre_completo: 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', ley_codigo: 'LPAC', articulo_numero: '68', apartado: null, titulo_capitulo: 'Título IV - Capítulo I: Iniciación del procedimiento', texto_integro: 'Si la solicitud de iniciación no reúne los requisitos que señala el artículo 66, y en su caso, los que señala el artículo 67 u otros exigidos por la legislación específica aplicable, se requerirá al interesado para que, en un plazo de diez días, subsane la falta o acompañe los documentos preceptivos, con indicación de que, si así no lo hiciera, se le tendrá por desistido de su petición, previa resolución que deberá ser dictada en los términos previstos en el artículo 21.', tema_ids: ['b0000000-0000-0000-0001-000000000011'] },
  { id: 'c0000000-0000-0000-0001-000000000010', ley_nombre: 'LPAC', ley_nombre_completo: 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', ley_codigo: 'LPAC', articulo_numero: '16', apartado: null, titulo_capitulo: 'Título II - Capítulo I: Registros', texto_integro: 'Cada Administración dispondrá de un Registro Electrónico General, en el que se hará el correspondiente asiento de todo documento que sea presentado o que se reciba en cualquier órgano administrativo, Organismo público o Entidad vinculado o dependiente a éstos.\nLos Organismos públicos vinculados o dependientes de cada Administración podrán disponer de su propio registro electrónico plenamente interoperable e interconectado con el Registro Electrónico General de la Administración de la que dependen.', tema_ids: ['b0000000-0000-0000-0001-000000000020'] },
  // TREBEP / EBEP
  { id: 'c0000000-0000-0000-0001-000000000011', ley_nombre: 'TREBEP', ley_nombre_completo: 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', ley_codigo: 'TREBEP', articulo_numero: '1', apartado: null, titulo_capitulo: 'Título I: Objeto y ámbito de aplicación', texto_integro: 'El presente Estatuto tiene por objeto establecer las bases del régimen estatutario de los funcionarios públicos incluidos en su ámbito de aplicación.\nAsimismo, tiene por objeto determinar las normas aplicables al personal laboral al servicio de las Administraciones Públicas.', tema_ids: ['b0000000-0000-0000-0001-000000000013'] },
  { id: 'c0000000-0000-0000-0001-000000000012', ley_nombre: 'TREBEP', ley_nombre_completo: 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', ley_codigo: 'TREBEP', articulo_numero: '14', apartado: null, titulo_capitulo: 'Título III - Capítulo II: Derechos individuales', texto_integro: 'Los empleados públicos tienen los siguientes derechos de carácter individual en correspondencia con la naturaleza jurídica de su relación de servicio:\na) A la inamovilidad en la condición de funcionario de carrera.\nb) Al desempeño efectivo de las funciones o tareas propias de su condición profesional y categoría.\nc) A la progresión en la carrera profesional y promoción interna según principios constitucionales de igualdad, mérito y capacidad.\nd) A percibir las retribuciones y las indemnizaciones por razón del servicio.', tema_ids: ['b0000000-0000-0000-0001-000000000014'] },
  { id: 'c0000000-0000-0000-0001-000000000013', ley_nombre: 'TREBEP', ley_nombre_completo: 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', ley_codigo: 'TREBEP', articulo_numero: '52', apartado: null, titulo_capitulo: 'Título VII - Capítulo I: Principios de conducta', texto_integro: 'Los empleados públicos deberán desempeñar con diligencia las tareas que tengan asignadas y velar por los intereses generales con sujeción y observancia de la Constitución y del resto del ordenamiento jurídico, y deberán actuar con arreglo a los siguientes principios: objetividad, integridad, neutralidad, responsabilidad, imparcialidad, confidencialidad, dedicación al servicio público, transparencia, ejemplaridad, austeridad, accesibilidad, eficacia, honradez y respeto a la igualdad entre mujeres y hombres.', tema_ids: ['b0000000-0000-0000-0001-000000000014'] },
  { id: 'c0000000-0000-0000-0001-000000000014', ley_nombre: 'TREBEP', ley_nombre_completo: 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', ley_codigo: 'TREBEP', articulo_numero: '55', apartado: null, titulo_capitulo: 'Título IV: Adquisición y pérdida de la relación de servicio', texto_integro: 'Todos los ciudadanos tienen derecho al acceso al empleo público de acuerdo con los principios constitucionales de igualdad, mérito y capacidad, y de acuerdo con lo previsto en el presente Estatuto y en el resto del ordenamiento jurídico.\nLas Administraciones Públicas seleccionarán a su personal funcionario y laboral mediante procedimientos en los que se garanticen los principios constitucionales antes expresados, así como los establecidos a continuación:\na) Publicidad de las convocatorias y de sus bases.\nb) Transparencia.\nc) Imparcialidad y profesionalidad de los miembros de los órganos de selección.\nd) Independencia y discrecionalidad técnica en la actuación de los órganos de selección.', tema_ids: ['b0000000-0000-0000-0001-000000000013'] },
  { id: 'c0000000-0000-0000-0001-000000000015', ley_nombre: 'TREBEP', ley_nombre_completo: 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', ley_codigo: 'TREBEP', articulo_numero: '93', apartado: null, titulo_capitulo: 'Título VII - Capítulo VI: Régimen disciplinario', texto_integro: 'Los funcionarios públicos y el personal laboral quedan sujetos al régimen disciplinario establecido en el presente Título y en las normas que las Leyes de Función Pública dicten en desarrollo de este Estatuto.\nLos funcionarios públicos o el personal laboral que indujeren a otros a la realización de actos o conductas constitutivos de falta disciplinaria incurrirán en la misma responsabilidad que éstos.', tema_ids: ['b0000000-0000-0000-0001-000000000014'] },
  { id: 'c0000000-0000-0000-0001-000000000016', ley_nombre: 'TREBEP', ley_nombre_completo: 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', ley_codigo: 'TREBEP', articulo_numero: '78', apartado: null, titulo_capitulo: 'Título V: Ordenación de la actividad profesional', texto_integro: 'Las Administraciones Públicas podrán establecer sistemas de carrera horizontal, sin necesidad de cambiar de puesto de trabajo, atendiendo a los siguientes criterios: progresión de grado, categoría, escalón u otros conceptos análogos, sin necesidad de cambiar de puesto de trabajo; valoración de la trayectoria y actuación profesional, la calidad de los trabajos realizados, los conocimientos adquiridos y el resultado de la evaluación del desempeño.', tema_ids: ['b0000000-0000-0000-0001-000000000013'] },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 OPTEK — Setup entorno de pruebas\n')

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 1. Oposición ──────────────────────────────────────────────────────────
  process.stdout.write('1. Oposición (Auxiliar Administrativo del Estado)... ')
  const { error: opErr } = await supabase.from('oposiciones').upsert({
    id: OPOSICION_ID,
    nombre: 'Auxiliar Administrativo del Estado',
    slug: 'aux-admin-estado',
    descripcion: 'Cuerpo General Auxiliar de la Administración del Estado (Grupo C, Subgrupo C2). Convocatoria 2025-2026.',
    num_temas: 28,
    activa: true,
  }, { onConflict: 'slug' })
  if (opErr) { console.error('❌', opErr.message); process.exit(1) }
  console.log('✅')

  // ── 2. Temas ──────────────────────────────────────────────────────────────
  process.stdout.write('2. 28 temas oficiales...\n')
  const temasConOposicion = TEMAS.map(t => ({ ...t, oposicion_id: OPOSICION_ID }))
  const { error: temasErr } = await supabase
    .from('temas')
    .upsert(temasConOposicion, { onConflict: 'oposicion_id,numero' })
  if (temasErr) { console.error('❌', temasErr.message); process.exit(1) }
  console.log(`   ✅ ${TEMAS.length} temas insertados/actualizados (Bloque I: 16, Bloque II: 12)`)

  // ── 3. Legislación ────────────────────────────────────────────────────────
  process.stdout.write('3. Legislación de referencia (CE + LPAC + TREBEP)...\n')
  const legConHash = LEGISLACION.map(l => ({
    ...l,
    hash_sha256: Buffer.from(l.texto_integro).toString('hex').slice(0, 64),
    fecha_ultima_verificacion: new Date().toISOString(),
  }))
  const { error: legErr } = await supabase
    .from('legislacion')
    .upsert(legConHash, { onConflict: 'id' })
  if (legErr) { console.error('❌', legErr.message); process.exit(1) }
  console.log(`   ✅ ${LEGISLACION.length} artículos legislativos insertados/actualizados`)

  // ── 4. Usuario de prueba ──────────────────────────────────────────────────
  process.stdout.write(`4. Usuario de prueba (${TEST_EMAIL})... `)

  // Intenta crear usuario; si ya existe, listamos para obtener su ID
  const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,  // auto-confirmar — no necesita verificar email
  })

  let userId: string

  if (createErr) {
    if (createErr.message.includes('already been registered') || createErr.message.includes('already exists')) {
      // Usuario ya existe — buscar su ID
      const { data: listData } = await supabase.auth.admin.listUsers()
      const existing = listData?.users.find(u => u.email === TEST_EMAIL)
      if (!existing) {
        console.error('❌ No se pudo obtener el usuario existente')
        process.exit(1)
      }
      userId = existing.id
      console.log('✅ (ya existía)')
    } else {
      console.error('❌', createErr.message)
      process.exit(1)
    }
  } else {
    userId = createData.user.id
    console.log('✅ (creado)')
  }

  // ── 5. Perfil del usuario de prueba ────────────────────────────────────────
  process.stdout.write('5. Configurando perfil (oposicion_id + saldo)... ')

  // Esperar un momento para que el trigger de creación de perfil se ejecute
  await new Promise(r => setTimeout(r, 1500))

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      oposicion_id: OPOSICION_ID,
      free_tests_used: 0,
      free_corrector_used: 0,
      corrections_balance: 20,  // saldo generoso para testing
    })
    .eq('id', userId)

  if (profileErr) { console.error('❌', profileErr.message); process.exit(1) }
  console.log('✅')

  // ── Verificación final ────────────────────────────────────────────────────
  const { count: temasCount } = await supabase.from('temas').select('*', { count: 'exact', head: true }).eq('oposicion_id', OPOSICION_ID)
  const { count: legCount } = await supabase.from('legislacion').select('*', { count: 'exact', head: true })
  const { data: profile } = await supabase.from('profiles').select('email, oposicion_id, corrections_balance').eq('id', userId).single()

  console.log('\n─────────────────────────────────────────')
  console.log('✅ ENTORNO DE PRUEBAS CONFIGURADO')
  console.log('─────────────────────────────────────────')
  console.log(`   Temas en BD:       ${temasCount} (de 28)`)
  console.log(`   Artículos legales: ${legCount}`)
  console.log(`   Usuario:           ${profile?.email}`)
  console.log(`   Oposición:         ${profile?.oposicion_id ? '✅ configurada' : '❌ NULL'}`)
  console.log(`   Saldo correc.:     ${profile?.corrections_balance}`)
  console.log('\n🔐 Credenciales de acceso:')
  console.log(`   Email:    ${TEST_EMAIL}`)
  console.log(`   Password: ${TEST_PASSWORD}`)
  console.log('\n🌐 Accede a: http://localhost:3000/login')
  console.log('   → Temas con legislación para tests: 1 (CE), 11 (LPAC), 13 (TREBEP)')
  console.log('─────────────────────────────────────────\n')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
