# **HexaFlow \- Gamer Edition: Pro-Tech Design System**

**Versión:** 1.0.0 (Tournament Ready)

**Enfoque:** Esports Analytics / Streamer Tools / Gaming Engine HUD / Competitive Dashboards

**Estado:** Overclocked (LTS)

**Nivel de Autoridad:** Tier-S Architecture

## **1\. Visión General: El Engine de Diseño**

**HexaFlow Gamer Edition** no es solo una interfaz; es un multiplicador de rendimiento. Está diseñado para jugadores, analistas de esports y creadores de contenido que operan en el límite de la capacidad humana. En un entorno donde 16ms pueden significar la diferencia entre la victoria y la derrota, nuestra arquitectura se aleja de la complacencia de las UIs comerciales para abrazar la **Dominancia Cognitiva**.

### **Atributos Clave y Filosofía**

* **Patrón Ultra-Immersivo (The Flow State):** Cada píxel está optimizado para mantener al usuario en el "Estado de Flujo". Eliminamos las distracciones visuales innecesarias, permitiendo que la información crítica se procese mediante visión periférica, dejando el foco central libre para la toma de decisiones tácticas.  
* **Layering de Poder (L0, L1, L2):** Implementamos una jerarquía de profundidad inspirada en los motores de renderizado de juegos AAA. Esta estructura separa el "Mundo" (datos base) de la "Interfaz de Acción" (controles) y las "Alertas de Supervivencia" (notificaciones críticas).  
* **Geometría de Fracción de Segundo (Hex-Logic):** La rejilla hexagonal no es estética; es eficiencia espacial. Los ángulos de 60° y 120° facilitan el escaneo visual diagonal, el cual es un 20% más rápido que el escaneo ortogonal en situaciones de alta presión.  
* **Feedback Táctico y Sinestesia:** El sistema no solo muestra datos; *reacciona*. Utilizamos iluminación reactiva (Glow) que pulsa según la carga de datos, permitiendo que el usuario "sienta" el pulso del sistema sin leer una sola palabra.

## **2\. Estilo Visual: Neon-Tactical Glass (Overdrive)**

Buscamos una estética que se sienta como una extensión de un hardware de alta gama. **HexaFlow** utiliza un acabado **"Dark Mode Overdrive"**, donde el vacío del fondo resalta la vitalidad de los datos.

### **El ADN Visual**

* **Palabras Clave:** Neon-Glow, RGB-Mapping, Tactical HUD, Sub-surface Scattering, Cyber-Grid, High-Refresh Design.  
* **Estrategia de Capas (System Layers):**  
  * **L0 (Base Layer \- The Battlefield):** Fondo ultra-oscuro (\#050608) con una rejilla hexagonal de bajo contraste (opacidad 5%). Actúa como el ancla visual.  
  * **L1 (Surface Layer \- Nodos de Poder):** Paneles de "Cristal Esmerilado" con desenfoque de fondo de 12px. Representan la lógica ejecutable y los dashboards de control.  
  * **L2 (Overdrive Layer \- Boss Alerts):** Elevación máxima. Elementos que flotan sobre el HUD con bordes iluminados para capturar la atención en situaciones de "Critical Health".

### **Mixin de Superficie Gamer (.hf-surface)**

/\* Estándar de renderizado para paneles de combate \*/  
.hf-surface--l1 {  
  background: rgba(18, 20, 29, 0.9);  
  border: 1.5px solid rgba(0, 245, 255, 0.35);  
  box-shadow:   
    0 0 20px rgba(0, 245, 255, 0.08),   
    inset 0 0 8px rgba(0, 0, 0, 0.9);  
  backdrop-filter: blur(15px) saturate(180%);  
  transition: border-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1);  
}

.hf-surface--l1:hover {  
  border-color: \#00F5FF; /\* Activación de energía en hover \*/  
  box-shadow: 0 0 30px rgba(0, 245, 255, 0.2);  
}

## **3\. Tokens de Diseño (Leveling Colors)**

Los colores en HexaFlow tienen jerarquía militar. No usamos colores "bonitos", usamos colores con propósitos tácticos claros.

| Token | Valor Hex | Uso Semántico e Implicaciones Tácticas |
| :---- | :---- | :---- |
| **Mana Cyan** | \#00F5FF | **Energía/Acción.** Nodos activos, selección de targets y botones de ejecución primaria. Indica disponibilidad de recursos. |
| **HP Green** | \#00FF85 | **Salud/Estabilidad.** Flujos de datos estables, procesos finalizados con éxito y latencia (ping) óptima. |
| **EXP Violet** | \#BF00FF | **Progreso/Level-Up.** Indicadores de carga, subida de niveles, sincronización de cuentas y recompensas desbloqueables. |
| **Void Black** | \#050608 | **Neutralización.** Fondo base. Su función es absorber la luz para eliminar el sangrado visual de los paneles. |
| **Carbon Fiber** | \#12141D | **Estructura.** Color de las tarjetas (L1). Representa la solidez del sistema y el hardware. |
| **Critical Red** | \#FF0055 | **Game Over.** Alertas de daño, errores fatales, desconexiones y picos de tráfico peligrosos. |
| **Ghost White** | \#E6EDF3 | **Info Clarity.** Texto de alta legibilidad. Utilizado para los encabezados que requieren lectura inmediata. |

## **4\. Tipografía: HUD Digital Hierarchy**

La tipografía debe sentirse grabada en un monitor de alto refresco. Priorizamos la "velocidad de lectura de caracteres" sobre la elegancia caligráfica.

### **Escala de Texto y Comportamiento**

* **Títulos Pro (H1):** *Inter (Black)*, 32px, Uppercase. Espaciado entre letras (tracking) de 0.15em para evitar que los caracteres se fusionen en resoluciones 4K.  
* **Subtítulos Tactical (H2-H3):** *Inter (Bold)*, 18px, All-Caps. Para secciones que definen el contexto (ej. "STATS", "EQUIPMENT", "MAP").  
* **UI Text (Body):** *Inter (Medium)*, 14px. Optimizada para párrafos cortos y labels de configuración.  
* **Data Stream (Mono):** *JetBrains Mono*, 12px. **Obligatoria para datos crudos.** Diseñada específicamente para que números como '0' y 'O' o '1' y 'l' sean imposibles de confundir en el calor de la batalla.

## **5\. Metodología: BEM Pro-Gaming (Buffs & Debuffs)**

Nuestra arquitectura BEM adopta terminología de RPG para que el equipo de desarrollo entienda el estado del componente al instante.

* **Bloque:** .hf-game-\[componente\] (ej. .hf-game-node)  
* **Elemento:** .hf-game-node\_\_\[item\] (ej. .hf-game-node\_\_status)  
* **Modificador:** .hf-game-node--\[buff/debuff\]  
  * \--buffed: Elemento con estado positivo o activo (Glow Cyan).  
  * \--nerfed: Elemento desactivado o en estado de error (Escala de grises).  
  * \--critical: Estado de alerta máxima (Pulsación roja).

### **Z-Index Map (The Depth Stack)**

Para evitar "z-index wars", hemos mapeado la profundidad según la importancia del juego:

1. **L0 (The World/Grid):** z-index: 10  
2. **L1 (HUD Elements):** z-index: 200  
3. **L2 (Inventory/Skill-tree):** z-index: 600  
4. **Ulti (Emergency Overlays):** z-index: 2000

## **6\. Biblioteca de Componentes**

### **A. Performance Tiles (Baldosas de Rendimiento)**

Nodos hexagonales inteligentes que actúan como sensores en tiempo real.

* **Visual:** Borde hexagonal con un clip-path preciso.  
* **Micro-interacción:** Al hacer hover, el nodo emite un "pulso de sonar" (un anillo que se expande) confirmando la interacción.  
* **Datos:** Muestra el valor central en *JetBrains Mono* con un delta porcentual (positivo en HP Green, negativo en Critical Red).

### **B. Command Center Layout (The HUD)**

Estructura de dashboard dividida en zonas de visión periférica:

1. **Top Bar (Global Stats):** Muestra el estado del sistema, hora local y latencia.  
2. **Side Rail (Quick Actions):** Navegación lateral ultra-delgada basada en iconos de 24px.  
3. **Central Core (The Battlefield):** Espacio dinámico donde los nodos se conectan mediante líneas de energía (Canvas API) que simulan el flujo de datos.

### **C. Skill-Tree Modals (Configuraciones)**

Modales de configuración que no tapan toda la pantalla, sino que utilizan el desenfoque L2 para mantener al usuario consciente de lo que ocurre detrás mientras ajusta sus parámetros.

## **7\. Lista de Verificación: Ready to Play (Compliance)**

* \[ \] **Iconografía de Combate:** ¿Todos los iconos son Lucide con un grosor de 2px para asegurar visibilidad en monitores de 144Hz?  
* \[ \] **Tactical Touch Targets:** ¿Los elementos interactivos tienen un área de acción de al menos 48x48px para evitar clics fallidos?  
* \[ \] **Input Lag Cero:** ¿Las transiciones de color son de 100ms o menos? (Cualquier cosa más lenta se siente como "lag" en un entorno gaming).  
* \[ \] **Glow Threshold:** ¿El resplandor neón mantiene un contraste de texto de al menos 4.5:1 para cumplir con accesibilidad sin perder el estilo?  
* \[ \] **Reduced Motion:** ¿Se ha implementado una alternativa estática para usuarios que desactivan las animaciones en el sistema operativo?

## **8\. Anti-patrones (Errores de "Noob")**

* **X Estética Soft/Rounded:** Las esquinas redondeadas de más de 4px matan la agresividad técnica. Un pro-player quiere bordes afilados.  
* **X Colores de "Marketing":** Prohibido el uso de degradados "púrpura/rosa" genéricos. El color debe significar un estado, no un adorno.  
* **X Animaciones de Rebote (Bouncy):** El rebote se siente infantil e impreciso. Usa curvas de velocidad linear o cubic-bezier(0.4, 0, 0.2, 1\).  
* **X Sobrecarga de Espacios en Blanco:** El "Whitespace" excesivo es desperdicio de información. Buscamos una **Densidad Táctica** donde cada milímetro de pantalla aporte valor.  
* **X Sombras Naturales:** Las sombras basadas en "fuentes de luz solar" no tienen lugar aquí. La luz proviene del hardware y de los datos; usa *glow* e *inner shadows*.