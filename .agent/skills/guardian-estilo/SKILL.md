---
name: guardian-estilo
description: Garantiza que todos los cambios visuales y de UI sigan estrictamente el sistema de diseño definido en ESTILO.md.
---

# Guardian de Estilo Skill

Esta habilidad actúa como un vigilante de la integridad visual del proyecto Hexa. Su objetivo es asegurar que cada píxel, color y animación cumpla con lo definido por el usuario en el manual de estilo principal.

## Instrucciones Operativas

1. **Consulta Obligatoria**:
   Antes de realizar cualquier modificación en archivos CSS, componentes HTML o lógica de UI, DEBES leer el archivo `/ESTILO.md` ubicado en la raíz del proyecto. No confíes en tu memoria de sesiones anteriores.

2. **Validación de Tokens**:
   - **Colores**: Usa solo los códigos hexadecimales o variables definidas. Si se solicita un color "rojo", busca el "Rojo Alerta" exacto en el manual.
   - **Tipografía**: Respeta las jerarquías de fuentes y tamaños (h1, h2, cuerpo, etc.).
   - **Espaciado**: Sigue el sistema de rejilla y márgenes definidos.

3. **Consistencia de Componentes**:
   Asegúrate de que los botones, tarjetas y otros elementos mantengan la misma semántica visual (bordes redondeados, sombras, efectos hover).

4. **Protocolo de Conflicto**:
   Si una instrucción del usuario contradice directamente lo que dice `ESTILO.md`, debes:
   - Identificar la contradicción.
   - Informar al usuario citando el manual.
   - Preguntar si desea actualizar el manual de estilo o si es una excepción puntual.

5. **Actualización Proactiva**:
   Si se crea un nuevo patrón de diseño aprobado en la conversación, sugiere al usuario documentarlo en `ESTILO.md` para que esta habilidad pueda protegerlo en el futuro.
