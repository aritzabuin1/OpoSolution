# Examenes Justicia - Estado de Descarga

> Generado: 2026-03-25
> Estado: **DESCARGA MANUAL REQUERIDA** (herramientas de red no disponibles en entorno actual)

---

## Resumen

No se pudieron descargar PDFs automaticamente. Las herramientas de acceso a red (Bash/curl, WebFetch, WebSearch) no estaban habilitadas en esta sesion. A continuacion se documentan las URLs conocidas y pasos para descarga manual.

---

## 1. Auxilio Judicial

**Directorio destino:** `/workspaces/OpoSolution/data/examenes_auxilio/`

### URLs a consultar

| Convocatoria | Tipo | URL probable | Estado |
|---|---|---|---|
| OEP 2024 | Pagina convocatoria | `https://www.mjusticia.gob.es/es/ciudadania/empleo-publico/acceso-libre/Auxilio-Judicial` | Pendiente |
| OEP 2023 | Pagina convocatoria | (buscar en portal empleo publico) | Pendiente |
| Generica | Cuadernillo examen | Buscar PDF en pagina de la convocatoria | Pendiente |
| Generica | Plantilla respuestas | Buscar PDF en pagina de la convocatoria | Pendiente |

### Convocatorias historicas conocidas
- OEP 2017-2018 (primer ejercicio celebrado ~2019)
- OEP 2019 (primer ejercicio celebrado ~2021)
- OEP 2021 (primer ejercicio celebrado ~2022)
- OEP 2022 (primer ejercicio celebrado ~2023)
- OEP 2023 (primer ejercicio celebrado ~2024)
- OEP 2024 (primer ejercicio celebrado ~2025)

---

## 2. Tramitacion Procesal

**Directorio destino:** `/workspaces/OpoSolution/data/examenes_tramitacion/`

### URLs a consultar

| Convocatoria | Tipo | URL probable | Estado |
|---|---|---|---|
| OEP 2024 | Pagina convocatoria | `https://www.mjusticia.gob.es/es/ciudadania/empleo-publico/acceso-libre/Tramitacion-Procesal` | Pendiente |
| OEP 2023 | Pagina convocatoria | (buscar en portal empleo publico) | Pendiente |
| Generica | Cuadernillo examen | Buscar PDF en pagina de la convocatoria | Pendiente |
| Generica | Plantilla respuestas | Buscar PDF en pagina de la convocatoria | Pendiente |

---

## 3. Gestion Procesal

**Directorio destino:** `/workspaces/OpoSolution/data/examenes_gestion_procesal/`

### URLs a consultar

| Convocatoria | Tipo | URL probable | Estado |
|---|---|---|---|
| OEP 2024 | Pagina convocatoria | `https://www.mjusticia.gob.es/es/ciudadania/empleo-publico/acceso-libre/Gestion-Procesal` | Pendiente |
| OEP 2023 | Pagina convocatoria | (buscar en portal empleo publico) | Pendiente |
| Generica | Cuadernillo examen | Buscar PDF en pagina de la convocatoria | Pendiente |
| Generica | Plantilla respuestas | Buscar PDF en pagina de la convocatoria | Pendiente |

---

## Instrucciones para descarga manual

### Paso 1: Navegar al portal de empleo publico del Ministerio de Justicia
- URL principal: `https://www.mjusticia.gob.es/es/ciudadania/empleo-publico`
- Alternativa: `https://www.mjusticia.gob.es/es/ciudadania/empleo-publico/oposiciones`

### Paso 2: Localizar las convocatorias
Buscar en la pagina las secciones de:
- **Cuerpo de Auxilio Judicial** (C2)
- **Cuerpo de Tramitacion Procesal y Administrativa** (C1)
- **Cuerpo de Gestion Procesal y Administrativa** (A2)

### Paso 3: Dentro de cada convocatoria, buscar
- **"Cuadernillo de examen"** o **"Ejercicio"** - el PDF con las preguntas del examen tipo test
- **"Plantilla de respuestas correctas"** o **"Plantilla definitiva"** - el PDF con las respuestas oficiales
- Puede haber plantilla provisional y plantilla definitiva (tras impugnaciones)

### Paso 4: Nomenclatura sugerida para los archivos descargados

```
examenes_auxilio/
  auxilio_2024_cuadernillo.pdf
  auxilio_2024_plantilla_provisional.pdf
  auxilio_2024_plantilla_definitiva.pdf
  auxilio_2023_cuadernillo.pdf
  auxilio_2023_plantilla_definitiva.pdf
  ...

examenes_tramitacion/
  tramitacion_2024_cuadernillo.pdf
  tramitacion_2024_plantilla_definitiva.pdf
  ...

examenes_gestion_procesal/
  gestion_2024_cuadernillo.pdf
  gestion_2024_plantilla_definitiva.pdf
  ...
```

### Paso 5: Fuentes alternativas
Si el portal del MJU no tiene los PDFs disponibles (a veces retiran documentos antiguos):

1. **BOE** - El Boletin Oficial del Estado publica las convocatorias: `https://www.boe.es`
2. **Opositores.net** / foros de opositores - suelen recopilar examenes anteriores
3. **CSIF / CCOO / UGT** - los sindicatos de justicia a menudo publican los cuadernillos
4. **Academia preparadores** - algunas publican examenes anteriores como recurso gratuito

### Patron de URLs del MJU (para intentar con curl)
El MJU usa URLs como:
```
https://www.mjusticia.gob.es/es/ciudadania/empleo-publico/acceso-libre/Auxilio-Judicial-PJC14372024
```
Donde `PJC14372024` es un identificador interno de la convocatoria. Estos IDs cambian con cada OEP.

Para descargar PDFs con curl:
```bash
# Primero obtener la pagina HTML de la convocatoria
curl -sL -A "Mozilla/5.0" "https://www.mjusticia.gob.es/es/ciudadania/empleo-publico" -o empleo.html

# Buscar enlaces PDF
grep -oP 'href="[^"]*\.pdf[^"]*"' empleo.html

# Descargar PDFs encontrados
curl -sL -A "Mozilla/5.0" -o archivo.pdf "URL_DEL_PDF"
```

---

## Archivos descargados

| Archivo | Cuerpo | Ano | Tipo | Estado |
|---|---|---|---|---|
| (ninguno) | - | - | - | Pendiente descarga manual |

---

## Notas
- Los examenes del MJU son tipo test (100 preguntas, 4 opciones, penalizan errores)
- Las plantillas definitivas son las que cuentan (pueden diferir de las provisionales)
- Priorizar OEP 2022, 2023, 2024 por ser las mas recientes y relevantes para el temario actual
- El temario puede cambiar entre convocatorias, los examenes mas recientes son los mas utiles
