# Antigravity Skills Tutorial

Este repositorio contiene una colección de ejemplos de **Habilidades** para [Google Antigravity](https://antigravity.google). Estos ejemplos demuestran el concepto de "Línea de Comandos Agentic", mostrando cómo integrar la experiencia, los flujos de trabajo y las herramientas en unidades modulares que un agente de IA puede usar.


## Overview

Las **Habilidades** de Antigravity permiten definir *cómo* debe comportarse un agente, qué herramientas debe usar y qué contexto debe referenciar. Este proyecto descompone el desarrollo de habilidades en 5 niveles de complejidad.

## The Skills

El directorio `skills_tutorial/` contiene los siguientes ejemplos:

### Nivel 1: Enrutamiento Básico
**`git-commit-formatter`**
*   **Concepto**: Ingeniería de Prompt Pura.
*   **Función**: Intercepta solicitudes de "confirmación" y formatea el mensaje de acuerdo con la especificación de confirmaciones convencionales.
*   **Key File**: `SKILL.md`

### Nivel 2: Utilización de Recursos
**`license-header-adder`**
*   **Concepto**: Carga de recursos estáticos.
*   **Función**: Agrega un encabezado de licencia estándar de Apache 2.0 a los archivos de origen leyendo una plantilla de la carpeta `resources/`.
*   **Key Files**: `SKILL.md`, `resources/HEADER_TEMPLATE.txt`

### Nivel 3: Aprendizaje por Ejemplo
**`json-to-pydantic`**
*   **Concepto**: Aprendizaje por Ejemplo.
*   **Función**: Convierte datos JSON en modelos Pydantic haciendo referencia a un par de "Ejemplo de oro" (Entrada JSON -> Salida Python) en lugar de utilizar instrucciones complejas.
*   **Key Files**: `SKILL.md`, `examples/`

### Nivel 4: Uso de Herramientas & Validación
**`database-schema-validator`**
*   **Concepto**: Delegación a scripts determinísticos.
*   **Función**: Valida archivos de esquema SQL para seguridad y convenciones de nomenclatura ejecutando un script de Python, asegurando 100% de precisión.
*   **Key Files**: `SKILL.md`, `scripts/validate_schema.py`

### Nivel 5: Composición (La "Batería Incluida" Skill)
**`adk-tool-scaffold`**
*   **Concepto**: Composición de scripts, plantillas y ejemplos.
*   **Función**: Orquesta un flujo completo para scaffoldear una nueva herramienta de ADK de Antigravity. Genera el archivo usando un script, lo llena desde una plantilla Jinja2 y guía la implementación usando un ejemplo de referencia.
*   **Key Files**: `SKILL.md`, `scripts/scaffold_tool.py`, `resources/ToolTemplate.py.hbs`, `examples/WeatherTool.py`

## Uso

Para usar estas habilidades en tu entorno de Antigravity:

1.  Clona este repositorio.
2.  Copia las carpetas deseadas de `skills_tutorial/` en tu directorio `.agent/skills/` (o en tu directorio global `~/.gemini/antigravity/skills/`).
3.  Reinicia tu sesión de agente.

## Licencia

Apache 2.0
