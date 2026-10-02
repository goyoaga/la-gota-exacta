<div align="center">

<img src="public/cover.svg" alt="La Gota Exacta: ilustración de un vaso con líquido turquesa" width="100%" />

# La Gota Exacta

**Un vaso. Una cantidad. Un solo intento.**

[![Jugar ahora](https://img.shields.io/badge/▶_JUGAR_AHORA-La_Gota_Exacta-176565?style=for-the-badge)](https://goyoaga.github.io/la-gota-exacta/)

![Three.js](https://img.shields.io/badge/Three.js-3D-1b3535?style=flat-square&logo=threedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-f2ce68?style=flat-square&logo=javascript&logoColor=1b3535)
![Vite](https://img.shields.io/badge/Vite-Build-8264c9?style=flat-square&logo=vite&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Hosting-316d70?style=flat-square&logo=github&logoColor=white)
![Mobile first](https://img.shields.io/badge/Móvil-Primero-c26a50?style=flat-square)

</div>

---

## El reto

Una cantidad en **ml** aparece sobre un vaso transparente. Mantén pulsado para llenarlo y suelta cuando creas que llegaste al objetivo. El número vertido se revela **después**. La forma del vaso cambia cómo sube el líquido.

<div align="center">

**OBJETIVO VISIBLE** &nbsp; → &nbsp; **MANTENER PULSADO** &nbsp; → &nbsp; **SOLTAR UNA VEZ** &nbsp; → &nbsp; **VEREDICTO**

</div>

| Lo que ves | Lo que haces |
| :--- | :--- |
| Objetivo entre 90 y 200 ml en un vaso de 250 ml | Estimas el nivel según la forma del recipiente. |
| Tres perfiles: recto, ancho abajo y ancho arriba | Mantienes pulsado el botón con el dedo o ratón; con teclado, **Espacio**. |
| Resultado en ml y diferencia real | Intentas mejorar tu récord personal en «Otra ronda». |

**Puntuación:** menos de 1 ml de diferencia es «¡Gota exacta!» y cae confeti; entre 1 y 5 ml es «Casi perfecto». Si te alejas más, el juego te dice si faltó o sobró. El récord se guarda en el navegador mediante `localStorage`. El confeti se omite si el dispositivo tiene activada la preferencia de movimiento reducido.

## Diseñado para una pausa

- Una ronda, un solo vertido y vuelta a jugar sin menús ni cuenta.
- Líquido **azul turquesa translúcido** y vasos 3D con volumen y altura coherentes.
- Controles táctiles, ratón y barra espaciadora; veredicto como texto fuera del lienzo 3D.
- El botón de altavoz comienza en **OFF**. Al tocarlo pasa a **ON** y reproduce una prueba breve de burbujas tipo «glup, glup»; después, acompaña el vertido y se detiene al soltar. El sonido procede de un archivo MP3 original y ligero (~35 KB), reproducido por un elemento de audio compatible con móviles. Puedes apagarlo con el mismo botón. Al volver a abrir la página comienza en OFF por las restricciones de audio móvil.
- Botón ☆ para aprender a guardarlo en favoritos. El navegador debe confirmar el marcador: una web no puede hacerlo sola.
- Sin publicidad, backend ni recopilación de datos personales en el juego.

## Jugar

**[Abrir La Gota Exacta](https://goyoaga.github.io/la-gota-exacta/)** · gratis y sin registro.

El código del proyecto está en [GitHub](https://github.com/goyoaga/la-gota-exacta).

### Ejecutar en local

Requiere Node.js 22 o superior y npm:

```bash
npm ci
npm run dev
```

Vite indicará la URL de desarrollo. Para verificar la compilación:

```bash
npm run build
npm run preview
```

**Vite sí se utiliza**: sirve el entorno de desarrollo y genera los archivos estáticos publicados por GitHub Actions. Three.js dibuja la escena; HTML y CSS presentan controles y resultado. El flujo de volumen se calcula en JavaScript sin motor de físicas.

## Cómo funciona el vaso

Cada forma usa un perfil de radio `r(h)`. El volumen de cada altura se calcula integrando la sección del vaso y se normaliza a 250 ml. El vaso, el líquido y las marcas se dibujan con ese mismo perfil. Por eso **100 ml** no llega a la misma altura en las tres formas, aunque el resultado matemático sea idéntico.

El contador interno avanza a 25 ml por segundo de pulsación activa. La pestaña oculta o el gesto cancelado cierran la ronda: el líquido no sigue avanzando en segundo plano. Los valores de ritmo y dificultad podrán ajustarse tras pruebas de juego.

## Apoya el proyecto

¿Lo pasaste bien durante un par de minutos? [Invítame un café en Ko-fi ☕](https://ko-fi.com/arielgoyoaga). Es totalmente voluntario y el juego siempre es gratuito.

---

<div align="center">

Hecho para **UNAMAS GAMES** · una partida más y seguimos.

</div>
