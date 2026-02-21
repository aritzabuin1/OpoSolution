---
name: apply_ddia_architecture
description: Aplicar principios DDIA (Fiabilidad, Escalabilidad, Mantenibilidad) en arquitecturas y código
---

Al recibir una solicitud para diseñar una arquitectura, escribir código (ej. Python, FastAPI) o estructurar flujos de datos y automatización, debes ejecutar obligatoriamente los siguientes pasos en orden para garantizar resultados medibles y robustos en producción:

1. **Análisis de Fiabilidad (Reliability) inicial:**
   - Identifica todos los puntos de integración externos (llamadas a modelos de OpenAI, APIs de terceros, bases de datos).
   - Implementa mecanismos de resiliencia por defecto: añade reintentos con *exponential backoff*, *timeouts* estrictos y manejo de excepciones en las llamadas de red.
   - Asume que las integraciones fallarán y diseña el código para que el sistema se recupere o falle con gracia, sin corromper el estado general ni dejar procesos colgados.

2. **Aislamiento de Cargas Pesadas (Scalability & Memory Management):**
   - Analiza el volumen de datos esperado. Si la tarea implica procesamiento intensivo (ej. transformación de reportes en Excel masivos, cruce complejo de datos o generación de PDFs), asume que habrá picos de consumo de RAM.
   - Nunca bloquees el hilo principal de ejecución ni satures la memoria de la instancia principal.
   - Separa el cómputo del almacenamiento. Aísla estas cargas pesadas delegándolas a *workers* en segundo plano, colas asíncronas o dividiendo el proceso en *sub-workflows* independientes para evitar caídas por falta de memoria (OOM crashes). El servicio expuesto debe mantenerse completamente *stateless*.

3. **Garantía de Consistencia en Base de Datos:**
   - Define el modelo de base de datos adecuado según la estructura de la información.
   - Si el flujo implica actualizaciones de estado concurrentes (ej. varios agentes o procesos modificando un mismo registro), previene activamente las escrituras perdidas (*lost updates*). 
   - Exige bloqueos explícitos, validaciones cruzadas estrictas o transacciones atómicas a nivel de base de datos.

4. **Inyección de Mantenibilidad y Observabilidad:**
   - No entregues código "mudo". Instrumenta la solución desde el diseño inicial.
   - Implementa *logging* estructurado detallando el inicio, éxito, o puntos de fallo de las operaciones críticas para facilitar el *troubleshooting* rápido.
   - Asegura que el código y los flujos sean idempotentes siempre que sea posible (que puedan reejecutarse tras un fallo sin duplicar facturas, registros o envíos).

5. **Validación y Reporte Final:**
   - Antes de dar por finalizada tu respuesta, incluye siempre un bloque de texto al final con el encabezado `[Checklist DDIA]`.
   - En ese bloque, resume en tres *bullet points* exactos cómo tu solución ha resuelto: 1) La mitigación de fallos de red y saturación de memoria, 2) La prevención de colisiones de datos concurrentes, y 3) La estrategia de observabilidad implementada.
