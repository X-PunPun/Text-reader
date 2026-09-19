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

| Motor | Requiere cuenta | Notas |
|---|---|---|
| Navegador (`native`) | No | Voces del sistema operativo. Funciona sin conexión y es el predeterminado. Es el único que informa de la palabra en curso. |
| StreamElements | No | Catálogo de Amazon Polly a través de un endpoint público. |
| Google Translate TTS | No | Endpoint público no oficial, limitado a ~200 caracteres por petición. |
| Custom endpoint | Depende | Pega la URL de tu propio servicio, con `{text}` y `{voice}` como marcadores. |

Los tres últimos son servicios de terceros: pueden limitar el ritmo de
peticiones o dejar de responder sin aviso. Por eso el motor del navegador
sigue siendo el predeterminado.

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
