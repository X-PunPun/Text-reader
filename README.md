# Text Reader

Web sencilla para escuchar cualquier texto en voz alta. Sin cuenta, sin
suscripción y sin límite de caracteres. Todo ocurre en el navegador.

## Cómo ejecutarlo en local

El proyecto usa módulos ES (`import` / `export`), y los navegadores los
bloquean si abres `index.html` con doble clic (protocolo `file://`). Hace
falta servirlo por HTTP:

```
scripts\serve.bat
```

Ese script levanta un servidor en `http://localhost:8080` y abre el navegador.
Usa Python si está instalado y, si no, Node (`npx serve`). Alternativas:

- Extensión **Live Server** de VS Code → clic derecho en `index.html` → *Open with Live Server*
- `python -m http.server 8080` desde la raíz del proyecto

En GitHub Pages funcionará sin ningún paso extra, porque allí ya se sirve por HTTP.

## Pruebas

El núcleo no depende del navegador, así que se puede probar con Node:

```
node tests/reader.test.mjs
```

## Funcionamiento

- **Resaltado en vivo:** mientras lee, marca la frase en curso y, con el motor
  del navegador, también la palabra exacta.
- **Control por cursor:** un clic en cualquier punto del texto salta a esa
  frase. Si está en pausa, al reanudar continúa desde donde dejaste el cursor.
- **Velocidad fija por pasos:** de 0.25x a 2.5x, como un reproductor de vídeo.
- **Tema e idioma:** claro/oscuro y 10 idiomas de interfaz; ambos se recuerdan.

## Motores de voz

| Motor | Cuenta / API key | Conexión | Notas |
|---|---|---|---|
| **Navegador** (`native`) | No | No necesita | Voces del sistema operativo. Predeterminado y el único que resalta la palabra exacta. En Brave o Chromium sin voces instaladas habrá muy pocas. |
| **Piper local** (`piper`) | No | Solo la primera vez | 124 voces neuronales en más de 30 idiomas. Se descargan una vez y quedan en el dispositivo. Unos 0,4 s por frase. |
| Custom endpoint | Depende | Sí | Tu propio servicio, con `{text}` y `{voice}` como marcadores. |

### Por qué no hay servicios públicos de TTS

El proyecto llegó a incluir StreamElements y el endpoint de Google Translate.
Se retiraron en septiembre de 2026 tras comprobar, desde la propia página
publicada, que ninguno funciona:

- **StreamElements** dejó de responder (hay reportes públicos de la caída).
- **Google Translate TTS** rechaza las peticiones con *Referer* de otro sitio.
- **Streamlabs Polly** no envía cabeceras CORS, así que el navegador bloquea
  la respuesta antes de que llegue al código.

El patrón se repite: estos servicios están pensados para llamarse desde un bot
o un servidor, no desde el navegador de un visitante. Desde una web estática no
hay forma de usarlos sin un intermediario. Si quieres uno, levanta un proxy
mínimo que añada `Access-Control-Allow-Origin` y apúntale con *Custom endpoint*.

### Voces locales (Piper)

La alternativa real, y la recomendada cuando el sistema trae pocas voces. Al
elegir una voz por primera vez se descarga su modelo (20–110 MB) desde Hugging
Face y se guarda en el **OPFS** del navegador; a partir de ahí la síntesis
ocurre en tu equipo, sin red y sin servicio que pueda caerse.

- Voz descargada: `✓`. Voz por descargar: su tamaño en MB.
- *Delete downloaded voice* borra el modelo del dispositivo.
- Español (España y México), inglés, portugués, francés, alemán, italiano,
  chino, árabe, ruso, catalán, neerlandés y una veintena más.
  **No hay japonés ni coreano**: para esos dos, motor del navegador.
- Requiere contexto seguro (`localhost` o `https`) y OPFS: Chrome, Edge o Brave
  actuales.
- Mientras suena una frase se sintetiza la siguiente, así que no hay silencios.

**Detalle de implementación.** La librería importa `onnxruntime-web/wasm` como
especificador desnudo y da por hecho que hay un bundler. Como aquí no lo hay,
`index.html` incluye un *import map* que resuelve ese nombre, y el adaptador
fija `wasmPaths` a la misma versión de ONNX Runtime y `numThreads = 1`, porque
los hilos de WebAssembly necesitan cabeceras COOP/COEP que GitHub Pages no
permite configurar. Sin esas tres piezas el motor falla con *no available
backend found*.

Librería: [`@mintplex-labs/piper-tts-web`](https://github.com/Mintplex-Labs/piper-tts-web) (MIT).

### Selección de voces por idioma

El desplegable muestra solo las voces del idioma elegido para la página. La
casilla **All languages** enseña el resto, y si para ese idioma no hay ninguna
voz se muestran todas avisando de ello.

## Arquitectura

Arquitectura hexagonal (puertos y adaptadores). El núcleo no conoce el DOM ni
ningún motor de voz concreto: solo habla con puertos, y los adaptadores son
piezas intercambiables.

```
index.html
src/
  core/                        ← dominio puro, testeable en Node
    domain/
      chunker.js               troceo del texto conservando posiciones
      speeds.js                escala de velocidades
    ports/
      speech.port.js           contrato de todo motor de voz
      storage.port.js          contrato de persistencia
    usecases/
      reader.js                orquesta play / pause / seek / rate
  adapters/                    ← implementaciones concretas
    speech/
      web-speech.adapter.js    Web Speech API del navegador
      piper-local.adapter.js   modelos Piper guardados en el dispositivo
      remote-tts.adapter.js    servicios HTTP que devuelven audio
      providers.js             catálogo de proveedores remotos
      engine-registry.js       selección de motor
    storage/
      local-storage.adapter.js
  ui/                          ← presentación
    main.js                    composición: enchufa adaptadores y UI
    components/                editor, velocidad, voces, tema
    i18n/                      motor de traducción + locales/
  styles/                      tokens, base, layout, componentes
scripts/                       servidor local
tests/                         pruebas del núcleo
```

### Añadir un motor de voz

1. Crea el adaptador en `src/adapters/speech/` cumpliendo `speech.port.js`.
2. Regístralo en `engine-registry.js`.

No hay que tocar el núcleo ni la interfaz: aparecerá solo en el selector.

### Añadir un idioma de interfaz

1. Copia `src/ui/i18n/locales/en.js` y traduce los valores.
2. Añade la entrada en `src/ui/i18n/locales/index.js`.
