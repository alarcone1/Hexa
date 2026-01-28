---
name: guardian-estilo
description: Garantiza que todos los cambios visuales y de UI sigan estrictamente el sistema de diseño definido en ESTILO.md y TARGET.md.
---

# Guardian de Estilo Skill

Esta habilidad actúa como un vigilante de la integridad visual del proyecto Hexa. Su objetivo es asegurar que cada píxel, color y animación cumpla con lo definido por el usuario en el manual de estilo principal.

## Instrucciones Operativas

1. **Consulta Obligatoria**:
Antes de realizar cualquier modificación en archivos CSS, componentes HTML o lógica de UI, DEBES leer y contrastar la información en:

- ESTILO.md: Ubicado en la raíz, para la implementación técnica y tokens.
- TARGET HexaFlow - Design System.pdf: Para la validación de la filosofía de diseño y cumplimiento de anti-patrones.
No confíes en tu memoria de sesiones anteriores.

2. **Validación de Tokens**:
   - **Colores**: Usa solo los códigos hexadecimales o variables definidas en ESTILO.md y validados por la jerarquía táctica del TARGET.md.
   - **Tipografía**: Respeta las jerarquías de fuentes y tamaños (JetBrains Mono para datos, Inter para HUD).
   - **Espaciado**: Sigue el sistema de rejilla, márgenes y jerarquía de capas (L0, L1, L2, Ulti) definidos.

3. **Consistencia de Componentes**:
   Asegúrate de que los botones, tarjetas y otros elementos mantengan la misma semántica visual y agresividad técnica (bordes afilados, efectos de neón-glow, curvas de transición rápidas).

4. **Protocolo de Conflicto**:
   Si una instrucción del usuario contradice directamente lo que dice ESTILO.md o el TARGET PDF, debes:
   - Identificar la contradicción.
   - Informar al usuario citando el manual o guía correspondiente.
   - Preguntar si desea actualizar el sistema de estilo o si es una excepción puntual.

5. **Actualización Proactiva**:
   Si se crea un nuevo patrón de diseño aprobado en la conversación, sugiere al usuario documentarlo en `ESTILO.md` para que esta habilidad pueda protegerlo en el futuro.
