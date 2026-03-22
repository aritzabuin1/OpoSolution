# Supuestos Practicos GACE — Few-shot examples para AI generation

## Archivos

| Archivo | Descripcion | Estado |
|---------|------------|--------|
| `supuesto_2024.pdf` | Supuesto Practico I, GACE 2024 (OEP 2022-2024), 7 pags | PDF descargado de INAP |
| `supuesto_2024_extracted.md` | Texto reconstruido del supuesto 2024 | Parcial (cuestiones 1-2 completas, 3-5 fragmentarias) |
| `supuesto_2022.pdf` | Supuesto Practico I, GACE 2022 (OEP 2020-2021-2022), 6 pags | PDF descargado de INAP |
| `supuesto_2022_extracted.md` | Texto reconstruido del supuesto 2022 | Parcial (cuestiones 1-2 completas, 3-5 fragmentarias) |
| `extract_pdf.py` | Script Python para extraer texto de los PDFs | Listo para ejecutar |

## Paso pendiente: Extraccion completa del texto

Los archivos `_extracted.md` fueron reconstruidos a partir de fragmentos web (search snippets, foros, blogs de academias). Para obtener el texto EXACTO y completo:

```bash
pip install PyPDF2  # o PyMuPDF para mejor calidad
cd data/examenes_a2/supuestos
python extract_pdf.py
```

Esto generara `supuesto_2024.txt` y `supuesto_2022.txt` con el texto completo extraido.

## Fuentes oficiales INAP

- **Supuesto 2024**: https://sede.inap.gob.es/documents/59312/2364302/SUPUESTOPRCTICOGACE-L_Z3OGCDSN11_154AB89SD658.pdf/f22f59b3-73e9-d8dd-462c-8c99498d6f7b
- **Supuesto 2022**: https://sede.inap.gob.es/documents/59312/2194895/SEGUNDO+EJERCICIO+GACE+TURNO+LIBRE.pdf/35c875c1-583d-4d71-381e-161570f51d33
- **Criterios correccion 2024**: https://sede.inap.gob.es/documents/59312/2364302/GACE+LI+2024.pdf/b6a96648-cc4d-7461-d073-86c4c3edb41a

## Fuentes de soluciones

- **Opolegemconcepto**: https://www.opolegemconcepto.com/2024/12/solucion-supuesto-practico-1-cuerpo-de.html
- **Superaoposiciones**: https://www.superaoposiciones.es/blog/soluciones-examen-gace
- **Gestiondeestado.com**: https://gestiondeestado.com/solucion-a-los-supuestos-practicos-oficiales-de-gace-del-16-09-2023/
- **Integra Oposiciones**: https://www.integraoposiciones.com/correccion-de-supuesto-practico-de-gace/

## Estructura de un supuesto practico GACE

- **Formato**: Escenario narrativo + 5 cuestiones con subpreguntas
- **Tiempo**: 150 minutos
- **Puntuacion**: 0-50 puntos (minimo 25 para aprobar)
  - Aplicacion practica: 0-30 pts
  - Organizacion: 0-5 pts
  - Capacidad analitica: 0-10 pts
  - Expresion escrita: 0-5 pts
- **Bloques**: IV (Organizacion), V (Derecho Administrativo/Presupuestario), VI (Funcion Publica)
- **Seleccion**: Se presentan 2 supuestos, el opositor elige 1

## Temas recurrentes en supuestos GACE

Basado en analisis de convocatorias 2019-2024:

1. **Procedimiento administrativo**: Notificaciones (Ley 39/2015), plazos, recursos
2. **Contratacion publica**: Tipos de contrato, adjudicacion, garantias (LCSP Ley 9/2017)
3. **Presupuestos**: Modificaciones presupuestarias, documentos contables (Ley 47/2003)
4. **Funcion publica**: Situaciones administrativas, permisos, promocion interna (TREBEP)
5. **Subvenciones**: Concesion, justificacion, reintegro, infracciones (Ley 38/2003)
6. **Regimen disciplinario**: Infracciones, sanciones, procedimiento (RD 33/1986)
7. **Abstension/recusacion**: Conflictos de interes (Ley 40/2015 art. 23-24)
