-- Migration 081: Contenido de estudio para Correos Tema 11 "Internacionalización y Aduanas"
-- Inserta en conocimiento_tecnico las secciones del tema (UPU, envíos internacionales, aduanas)

-- Resolve tema_id for Correos tema 11
DO $$
DECLARE
  v_tema_id uuid;
BEGIN
  SELECT id INTO v_tema_id
  FROM temas
  WHERE oposicion_id = 'd0000000-0000-0000-0000-000000000001'
    AND numero = 11;

  IF v_tema_id IS NULL THEN
    RAISE EXCEPTION 'Tema 11 de Correos no encontrado';
  END IF;

  -- 1. Unión Postal Universal (UPU)
  INSERT INTO conocimiento_tecnico (bloque, tema_id, titulo_seccion, contenido, hash_sha256)
  VALUES (
    'correos', v_tema_id,
    'La Unión Postal Universal (UPU): estructura y funciones',
    E'## La Unión Postal Universal (UPU)\n\n### Origen y naturaleza jurídica\nLa Unión Postal Universal (UPU) es un organismo especializado de las Naciones Unidas, con sede en **Berna (Suiza)**. Fue fundada en 1874 mediante el **Tratado de Berna**, siendo una de las organizaciones internacionales más antiguas del mundo. España es miembro fundador.\n\n### Misión\nLa UPU tiene como misión principal **estimular el desarrollo duradero de servicios postales universales de calidad**, eficientes y accesibles, para facilitar la comunicación entre los habitantes del planeta.\n\n### Estructura organizativa\nLa UPU se compone de cuatro órganos principales:\n\n1. **Congreso Postal Universal**: Órgano supremo. Se reúne cada 4 años. Establece las normas generales y la estrategia.\n2. **Consejo de Administración (CA)**: 41 miembros. Asegura la continuidad entre congresos. Aprueba el presupuesto.\n3. **Consejo de Explotación Postal (CEP)**: 40 miembros. Órgano técnico y operativo. Elabora normas técnicas.\n4. **Oficina Internacional**: Secretaría permanente dirigida por el Director General. Apoyo logístico y técnico.\n\n### Actas de la UPU\nEl marco normativo de la UPU se compone de:\n- **Constitución de la UPU** (1964, enmendada): Acta fundamental.\n- **Reglamento General**: Normas de funcionamiento de los órganos.\n- **Convenio Postal Universal**: Normas comunes del servicio postal internacional. Obligatorio para todos los países miembros.\n- **Acuerdos**: Regulan servicios opcionales (encomiendas postales, giros, etc.).\n\n### Principios fundamentales\n- **Territorio postal único**: Los 192 países miembros forman un solo territorio postal.\n- **Libertad de tránsito**: Cada país garantiza el tránsito de envíos postales por su territorio.\n- **Gastos terminales**: Sistema de remuneración entre operadores por la distribución de correo internacional entrante.\n- **Tarifas**: Cada país fija sus propias tarifas, respetando los principios de la UPU.',
    encode(digest('upu_estructura_v1', 'sha256'), 'hex')
  )
  ON CONFLICT (bloque, tema_id, titulo_seccion) DO UPDATE
    SET contenido = EXCLUDED.contenido, hash_sha256 = EXCLUDED.hash_sha256, updated_at = now();

  -- 2. Envíos internacionales: tipos y clasificación
  INSERT INTO conocimiento_tecnico (bloque, tema_id, titulo_seccion, contenido, hash_sha256)
  VALUES (
    'correos', v_tema_id,
    'Envíos postales internacionales: tipos y clasificación',
    E'## Envíos postales internacionales\n\n### Clasificación según el Convenio Postal Universal\nEl Convenio Postal Universal establece las siguientes categorías de envíos internacionales:\n\n#### 1. Envíos de correspondencia (LC - Lettres et Cartes)\n- **Cartas**: Comunicaciones escritas. Peso máximo: 2 kg.\n- **Tarjetas postales**: Cartón rígido con dimensiones normalizadas.\n- **Impresos**: Publicaciones, catálogos. Peso máximo: 5 kg.\n- **Cecogramas**: Envíos para ciegos. Gratuitos o tarifa reducida. Peso máximo: 7 kg.\n- **Pequeños paquetes**: Mercancía. Peso máximo: 2 kg.\n\n#### 2. Encomiendas postales (CP - Colis Postaux)\nPaquetes con mercancía. Peso máximo según acuerdos bilaterales (generalmente hasta 20-30 kg).\n\n#### 3. Servicios opcionales\n- **EMS (Express Mail Service)**: Servicio de envíos urgentes internacionales (en España: Postal Express).\n- **Giros postales internacionales**: Transferencias de dinero entre países.\n\n### Servicios complementarios\n- **Certificado**: Acuse de imposición con número de seguimiento.\n- **Valor declarado**: Cobertura por pérdida o avería hasta el valor declarado.\n- **Aviso de recibo (AR)**: Confirmación de entrega firmada por el destinatario.\n- **Reexpedición**: Envío a nueva dirección.\n- **Entrega en propia mano**: Solo al destinatario.\n\n### Zonas geográficas de Correos\nCorreos divide los destinos internacionales en zonas para tarifar:\n- **Zona 1**: Europa, incluida Turquía.\n- **Zona 2**: Resto del mundo (América, Asia, África, Oceanía).\n\n### Plazos de entrega internacionales\nLos plazos son indicativos (no garantizados salvo EMS):\n- Europa: 3-7 días hábiles (carta ordinaria).\n- Resto del mundo: 7-15 días hábiles.\n- EMS: 2-4 días hábiles según destino.',
    encode(digest('envios_internacionales_v1', 'sha256'), 'hex')
  )
  ON CONFLICT (bloque, tema_id, titulo_seccion) DO UPDATE
    SET contenido = EXCLUDED.contenido, hash_sha256 = EXCLUDED.hash_sha256, updated_at = now();

  -- 3. Procedimientos aduaneros
  INSERT INTO conocimiento_tecnico (bloque, tema_id, titulo_seccion, contenido, hash_sha256)
  VALUES (
    'correos', v_tema_id,
    'Procedimientos aduaneros en envíos postales',
    E'## Procedimientos aduaneros en envíos postales\n\n### Marco normativo\nLos envíos postales internacionales están sujetos a la normativa aduanera de la UE:\n- **Reglamento (UE) nº 952/2013**: Código Aduanero de la Unión (CAU).\n- **Convenio Postal Universal**: Normas específicas para envíos postales.\n- Normativa nacional de la AEAT (Agencia Estatal de Administración Tributaria).\n\n### Documentación aduanera\n\n#### Declaración CN 22\n- Para envíos de **hasta 300 DEG** (Derechos Especiales de Giro, aprox. 370 EUR).\n- Etiqueta adhesiva verde pegada al exterior del envío.\n- Datos: descripción del contenido, peso, valor, origen.\n\n#### Declaración CN 23\n- Para envíos de **más de 300 DEG** o cuando la administración postal lo requiera.\n- Formulario más detallado con descripción pormenorizada.\n- Se adjunta en sobre transparente al exterior.\n\n#### Declaración electrónica (ITED)\nDesde 2021, la UPU exige **declaraciones electrónicas previas** (datos anticipados) para todos los envíos postales internacionales. Correos transmite los datos al sistema AEAT antes de la llegada.\n\n### Proceso de despacho aduanero\n\n1. **Recepción en oficina de cambio**: Los envíos internacionales llegan al Centro de Tratamiento Internacional (en España, principalmente Madrid-Barajas).\n2. **Presentación ante Aduanas**: Correos presenta los envíos con la documentación.\n3. **Inspección y verificación**: La Aduana puede:\n   - **Despachar** directamente (libre de derechos).\n   - **Retener** para inspección física.\n   - **Solicitar documentación adicional** al destinatario.\n4. **Liquidación de derechos**: Si procede, se liquidan:\n   - **Derechos arancelarios**: Según el tipo de mercancía y origen.\n   - **IVA a la importación**: 21% general (10% o 4% reducido según producto).\n5. **Entrega al destinatario**: Correos entrega el envío y cobra los derechos/tasas al destinatario.\n\n### Franquicias aduaneras\n- **Envíos entre particulares**: Exentos hasta **45 EUR** de valor.\n- **Compras online (B2C)**: Desde julio 2021, **NO hay franquicia** — todos los envíos comerciales tributan IVA desde el primer euro (sistema IOSS).\n- **Envíos de valor inferior a 150 EUR**: Exentos de derechos arancelarios, pero SÍ pagan IVA.\n\n### Artículos prohibidos y restringidos\nEl Convenio Postal Universal prohíbe en envíos internacionales:\n- Estupefacientes y sustancias psicotrópicas.\n- Material explosivo, inflamable o peligroso.\n- Animales vivos (salvo excepciones: abejas, parásitos de laboratorio).\n- Moneda (billetes, monedas en curso).\n- Armas de fuego y municiones.\n- Artículos cuya importación/exportación esté prohibida en origen o destino.',
    encode(digest('aduanas_procedimientos_v1', 'sha256'), 'hex')
  )
  ON CONFLICT (bloque, tema_id, titulo_seccion) DO UPDATE
    SET contenido = EXCLUDED.contenido, hash_sha256 = EXCLUDED.hash_sha256, updated_at = now();

  -- 4. Productos internacionales de Correos
  INSERT INTO conocimiento_tecnico (bloque, tema_id, titulo_seccion, contenido, hash_sha256)
  VALUES (
    'correos', v_tema_id,
    'Productos internacionales de Correos',
    E'## Productos internacionales de Correos\n\n### Carta internacional\n- Envíos de documentos y correspondencia.\n- Peso máximo: 2 kg.\n- Sin seguimiento (ordinaria) o con seguimiento (certificada).\n- Modalidades: ordinaria, prioritaria, certificada.\n\n### Paquete internacional\n**Paquete Internacional Económico:**\n- Envío de mercancía por superficie/aéreo económico.\n- Peso máximo: 20 kg.\n- Con seguimiento y entrega contra firma.\n- Plazo orientativo: 10-20 días según destino.\n\n**Paquete Internacional Prioritario:**\n- Envío aéreo con prioridad.\n- Peso máximo: 20 kg.\n- Con seguimiento completo y entrega contra firma.\n- Plazo orientativo: 5-10 días según destino.\n\n### EMS Postal Express\n- Servicio urgente internacional de la UPU.\n- Entrega puerta a puerta con seguimiento integral.\n- Peso máximo: 20 kg.\n- Plazo: 2-4 días hábiles.\n- Incluye intento de entrega y gestión aduanera.\n\n### Paq Premium Internacional\n- Evolución del paquete internacional premium de Correos.\n- Seguimiento integral puerta a puerta.\n- Entrega en domicilio o punto de conveniencia.\n- Disponible para envíos a Europa y principales destinos.\n\n### Correos Internacional de Publicaciones\n- Para editoriales y empresas de prensa.\n- Envío de periódicos, revistas y publicaciones periódicas.\n- Tarifas especiales para grandes volúmenes.\n\n### Servicios adicionales internacionales\n- **Reembolso**: Solo disponible para algunos destinos.\n- **Seguro**: Cobertura adicional por pérdida o deterioro.\n- **Petición de devolución o modificación de dirección**: Posibilidad de redirigir o devolver envíos en tránsito.\n- **Agrupación empresarial**: Servicios personalizados para grandes clientes.\n\n### Sistema IOSS (Import One-Stop Shop)\nDesde julio 2021, la UE implantó el sistema IOSS para simplificar el IVA en comercio electrónico:\n- Los vendedores online cobran el IVA en el momento de la venta.\n- El envío llega con IVA ya pagado → no hay cobro al destinatario.\n- Correos gestiona la documentación electrónica con el número IOSS del vendedor.\n- Aplica a envíos comerciales de hasta 150 EUR.',
    encode(digest('productos_internacionales_v1', 'sha256'), 'hex')
  )
  ON CONFLICT (bloque, tema_id, titulo_seccion) DO UPDATE
    SET contenido = EXCLUDED.contenido, hash_sha256 = EXCLUDED.hash_sha256, updated_at = now();

  -- 5. Acuerdos bilaterales y organismos postales
  INSERT INTO conocimiento_tecnico (bloque, tema_id, titulo_seccion, contenido, hash_sha256)
  VALUES (
    'correos', v_tema_id,
    'Acuerdos bilaterales y organismos postales regionales',
    E'## Acuerdos bilaterales y organismos postales regionales\n\n### PostEurop\n- Asociación de operadores postales públicos europeos.\n- 52 miembros de 49 países.\n- Promueve la cooperación postal en Europa.\n- Coordina estándares de calidad (objetivo J+3 para cartas prioritarias transfronterizas en la UE).\n\n### UPAEP (Unión Postal de las Américas, España y Portugal)\n- Unión Restringida de la UPU.\n- Vincula a España con Iberoamérica en materia postal.\n- Sede en Montevideo (Uruguay).\n- Promueve la modernización postal en la región.\n\n### Acuerdos bilaterales de Correos\nCorreos mantiene acuerdos con operadores postales de otros países para:\n- **Gastos terminales**: Remuneración por la entrega de correo entrante.\n- **EPG (European Parcels Group)**: Alianza para el intercambio de paquetería en Europa.\n- **IPC (International Post Corporation)**: Cooperativa de 27 operadores postales para mejorar la calidad del servicio transfronterizo.\n\n### Sistema de gastos terminales\nMecanismo de compensación entre operadores postales:\n- El país de origen paga al país de destino por clasificar y distribuir los envíos.\n- Las tarifas se fijan en el Congreso de la UPU (sistema actual aprobado en 2016, Estambul).\n- Desde 2020, EE.UU. fija sus propias tarifas (auto-declaración tras amenazar con abandonar la UPU).\n- Los gastos terminales buscan reflejar los costes reales de distribución.\n\n### Etiquetado y codificación internacional\n- **Código de barras S10**: Estándar UPU para tracking internacional. Formato: 2 letras (tipo) + 9 dígitos + 2 letras (país). Ej: RR123456789ES.\n  - RR = Certificado, EE = EMS, CP = Colis Postal, etc.\n- **Código postal universal**: La UPU promueve la adopción de códigos postales en todos los países miembros.\n- **Etiqueta CN 22/CN 23**: Declaraciones aduaneras normalizadas (ver sección de aduanas).',
    encode(digest('organismos_postales_v1', 'sha256'), 'hex')
  )
  ON CONFLICT (bloque, tema_id, titulo_seccion) DO UPDATE
    SET contenido = EXCLUDED.contenido, hash_sha256 = EXCLUDED.hash_sha256, updated_at = now();

END $$;
