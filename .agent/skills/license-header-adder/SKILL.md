---
name: license-header-adder
description: Agrega el encabezado de licencia estándar de código abierto a nuevos archivos fuente. Se usa al crear archivos de código que requieren atribución de derechos de autor.
---

# License Header Adder Skill

Esta habilidad asegura que todos los archivos fuente nuevos tengan el encabezado de copyright correcto sin errores tipográficos.

## Instructions

1. **Leer la Plantilla**:
   Leer el contenido del archivo de plantilla ubicado en `resources/HEADER_TEMPLATE.txt`.

2. **Anteponer al Archivo**:
   Anteponer el contenido del archivo de plantilla al inicio del archivo `target_file`.

3. **Adaptar la Sintaxis de Comentarios**:
   - Para lenguajes C-style (Java, JS, TS, C++, Go), mantener el bloque `/* ... */` como está.
   - Para Python, Shell, o YAML, convertir el bloque a usar comentarios `#`.
   - Para HTML/XML, usar `<!-- ... -->`.

4. **Preservar el Contenido**:
   No resumas ni parafrasees el texto legal. Debe copiarse exactamente como aparece en el recurso.
