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
| **Navegador** (`native`) | No | No necesita | Voces del sistema operativo. Predeterminado y el único que resalta la palabra exacta. |
| **Piper local** (`piper`) | No | Solo la primera vez | Modelos neuronales que se descargan una vez y quedan guardados en el dispositivo. Después funciona sin conexión. |
| StreamElements | No | Sí | Endpoint público no oficial. Inestable: puede estar caído. |
| Google Translate TTS | No | Sí | Endpoint público no oficial, ~200 caracteres por petición. |
| Custom endpoint | Depende | Sí | Pega la URL de tu propio servicio, con `{text}` y `{voice}`. |

### Voces locales (Piper)

La opción recomendada cuando las voces del sistema no bastan y no se quiere
depender de ningún servicio. Al elegir una voz por primera vez se descarga su
modelo (unos 20–80 MB) desde Hugging Face y se guarda en el **OPFS** del
navegador; a partir de ahí la síntesis ocurre en tu equipo.

- Las voces ya descargadas aparecen marcadas con `✓`; las demás muestran su tamaño.
- *Delete downloaded voice* borra el modelo del dispositivo.
- Hay voces en español, inglés, portugués, francés, alemán, italiano, chino,
  árabe, ruso y una veintena de idiomas más. **No hay japonés ni coreano**: para
  esos dos sigue siendo mejor el motor del navegador.
- Necesita un contexto seguro (`localhost` o `https`) y un navegador con OPFS
  (Chrome o Edge actuales; Firefox y Safari pueden no funcionar).
- Mientras suena una frase se va sintetizando la siguiente, para que no haya
  silencios entre medias.

Librería usada: [`@mintplex-labs/piper-tts-web`](https://github.com/Mintplex-Labs/piper-tts-web)
(MIT), cargada desde jsDelivr solo cuando se selecciona este motor.

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
