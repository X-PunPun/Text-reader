/**
 * Textos de cada versión de idioma: lo que ven los buscadores.
 *
 * El título y la descripción son lo que aparece en el resultado de búsqueda.
 * El resto es el contenido de la página, que es lo que decide para qué
 * búsquedas puede salir: una aplicación sin texto no tiene nada que indexar.
 */

export const SITE = "https://x-punpun.github.io/Text-reader";

export const CONTENT = {
  en: {
    locale: "en_US",
    title: "Text Reader — free text to speech in your browser, no sign-up",
    description:
      "Paste any text and listen to it. Free, no account, no character limit. Natural voices that download once and then work offline, and you can save the audio as MP3 or WAV.",
    h1: "Free text to speech, straight in your browser",
    intro:
      "Text Reader turns written text into speech without asking for an account, an email or a card. Paste a chapter, an article or your own notes and press play. There is no character limit and nothing is uploaded anywhere: the text never leaves your device.",
    ha: "Voices that work offline",
    pa: "Besides the voices already installed in your operating system, you can download neural voices in more than thirty languages. Each one is downloaded once, stays on your device and works after that with no connection and no service that can go down.",
    hb: "Follow the reading and jump anywhere",
    pb: "The sentence and the exact word being spoken are highlighted as it reads. Pause, click on any word, and it continues from there. Speed goes from 0.25x to 2.5x in fixed steps, like a video player.",
    hc: "Save the audio as a file",
    pc: "The whole reading can be downloaded as MP3 at 128, 192 or 320 kbps, or as uncompressed WAV at 16 or 24 bits if you plan to edit it afterwards.",
    hfaq: "Questions",
    faq: [
      ["Is it really free?", "Yes. There is no account, no trial and no limit on how much text you read. It is an open source project and everything runs in your browser."],
      ["Does my text get uploaded to a server?", "No. The text stays in your browser. The downloadable voices are fetched once from Hugging Face, and after that the app works with no connection at all."],
      ["Which languages can it read?", "The downloadable voices cover more than thirty languages, including Spanish, English, Portuguese, French, German, Italian, Chinese, Arabic and Russian. Japanese and Korean rely on your system voices."],
      ["Can I download the audio?", "Yes, as MP3 or WAV. Pick the format next to the save button and the whole reading is generated as a single file."]
    ],
    features: ["Free text to speech", "Offline neural voices", "MP3 and WAV export", "No account required"]
  },

  es: {
    locale: "es_ES",
    title: "Lector de texto en voz alta — gratis, sin registro, en tu navegador",
    description:
      "Pega cualquier texto y escúchalo. Gratis, sin cuenta y sin límite de caracteres. Voces naturales que se descargan una vez y funcionan sin conexión, y puedes guardar el audio en MP3 o WAV.",
    h1: "Lector de texto en voz alta, gratis y sin registro",
    intro:
      "Text Reader convierte texto escrito en voz sin pedirte una cuenta, un correo ni una tarjeta. Pega un capítulo, un artículo o tus apuntes y dale a reproducir. No hay límite de caracteres y nada se sube a ningún sitio: el texto no sale de tu dispositivo.",
    ha: "Voces que funcionan sin conexión",
    pa: "Además de las voces ya instaladas en tu sistema operativo, puedes descargar voces neuronales en más de treinta idiomas. Cada una se descarga una sola vez, se queda en tu dispositivo y a partir de ahí funciona sin conexión y sin depender de ningún servicio que pueda caerse.",
    hb: "Sigue la lectura y salta donde quieras",
    pb: "Se resalta la frase y la palabra exacta que se está diciendo. Pon en pausa, haz clic en cualquier palabra y continúa desde ahí. La velocidad va de 0.25x a 2.5x en pasos fijos, como un reproductor de vídeo.",
    hc: "Guarda el audio en un archivo",
    pc: "La lectura completa se puede descargar en MP3 a 128, 192 o 320 kbps, o en WAV sin comprimir a 16 o 24 bits si luego vas a editarla.",
    hfaq: "Preguntas frecuentes",
    faq: [
      ["¿De verdad es gratis?", "Sí. No hay cuenta, ni prueba limitada, ni tope de texto. Es un proyecto de código abierto y todo se ejecuta en tu navegador."],
      ["¿Mi texto se sube a algún servidor?", "No. El texto se queda en tu navegador. Las voces descargables se obtienen una vez de Hugging Face y después la aplicación funciona sin conexión."],
      ["¿Qué idiomas puede leer?", "Las voces descargables cubren más de treinta idiomas, entre ellos español, inglés, portugués, francés, alemán, italiano, chino, árabe y ruso. Para japonés y coreano se usan las voces de tu sistema."],
      ["¿Puedo descargar el audio?", "Sí, en MP3 o WAV. Elige el formato junto al botón de guardar y se genera la lectura completa en un solo archivo."]
    ],
    features: ["Lector de texto gratuito", "Voces sin conexión", "Exporta a MP3 y WAV", "Sin registro"]
  },

  pt: {
    locale: "pt_BR",
    title: "Leitor de texto em voz alta — grátis, sem cadastro, no navegador",
    description:
      "Cole qualquer texto e ouça. Grátis, sem conta e sem limite de caracteres. Vozes naturais que baixam uma vez e funcionam offline, e você pode salvar o áudio em MP3 ou WAV.",
    h1: "Leitor de texto em voz alta, grátis e sem cadastro",
    intro:
      "O Text Reader transforma texto escrito em voz sem pedir conta, e-mail nem cartão. Cole um capítulo, um artigo ou suas anotações e aperte reproduzir. Não há limite de caracteres e nada é enviado para lugar nenhum: o texto não sai do seu dispositivo.",
    ha: "Vozes que funcionam offline",
    pa: "Além das vozes já instaladas no seu sistema, você pode baixar vozes neurais em mais de trinta idiomas. Cada uma é baixada uma única vez, fica no seu dispositivo e depois funciona sem conexão e sem depender de nenhum serviço.",
    hb: "Acompanhe a leitura e pule para onde quiser",
    pb: "A frase e a palavra exata que está sendo lida ficam destacadas. Pause, clique em qualquer palavra e a leitura continua dali. A velocidade vai de 0.25x a 2.5x em passos fixos, como num player de vídeo.",
    hc: "Salve o áudio em um arquivo",
    pc: "A leitura inteira pode ser baixada em MP3 a 128, 192 ou 320 kbps, ou em WAV sem compressão a 16 ou 24 bits, caso vá editar depois.",
    hfaq: "Perguntas frequentes",
    faq: [
      ["É realmente grátis?", "Sim. Não há conta, período de teste nem limite de texto. É um projeto de código aberto e tudo roda no seu navegador."],
      ["Meu texto vai para algum servidor?", "Não. O texto fica no seu navegador. As vozes para download são obtidas uma vez do Hugging Face e depois o aplicativo funciona offline."],
      ["Quais idiomas ele lê?", "As vozes para download cobrem mais de trinta idiomas, incluindo português, espanhol, inglês, francês, alemão, italiano, chinês, árabe e russo. Para japonês e coreano use as vozes do sistema."],
      ["Posso baixar o áudio?", "Sim, em MP3 ou WAV. Escolha o formato ao lado do botão de salvar e a leitura inteira é gerada num único arquivo."]
    ],
    features: ["Leitor de texto grátis", "Vozes offline", "Exporta em MP3 e WAV", "Sem cadastro"]
  }

  ,fr: {
    locale: "fr_FR",
    title: "Lecteur de texte à voix haute — gratuit, sans inscription",
    description:
      "Collez n'importe quel texte et écoutez-le. Gratuit, sans compte et sans limite de caractères. Des voix naturelles téléchargées une fois qui fonctionnent hors ligne, et l'audio s'enregistre en MP3 ou WAV.",
    h1: "Lecteur de texte à voix haute, gratuit et sans inscription",
    intro:
      "Text Reader transforme un texte écrit en voix sans demander de compte, d'e-mail ni de carte. Collez un chapitre, un article ou vos notes et lancez la lecture. Aucune limite de caractères et rien n'est envoyé nulle part : le texte ne quitte pas votre appareil.",
    ha: "Des voix qui fonctionnent hors ligne",
    pa: "En plus des voix déjà installées sur votre système, vous pouvez télécharger des voix neuronales dans plus de trente langues. Chacune se télécharge une seule fois, reste sur votre appareil et fonctionne ensuite sans connexion ni service extérieur.",
    hb: "Suivez la lecture et déplacez-vous librement",
    pb: "La phrase et le mot exact prononcés sont surlignés. Mettez en pause, cliquez sur n'importe quel mot et la lecture reprend à cet endroit. La vitesse va de 0.25x à 2.5x par paliers, comme un lecteur vidéo.",
    hc: "Enregistrez l'audio dans un fichier",
    pc: "La lecture complète se télécharge en MP3 à 128, 192 ou 320 kbps, ou en WAV non compressé en 16 ou 24 bits si vous comptez l'éditer.",
    hfaq: "Questions fréquentes",
    faq: [
      ["Est-ce vraiment gratuit ?", "Oui. Pas de compte, pas d'essai limité, pas de quota de texte. C'est un projet open source et tout s'exécute dans votre navigateur."],
      ["Mon texte est-il envoyé sur un serveur ?", "Non. Le texte reste dans votre navigateur. Les voix téléchargeables sont récupérées une fois depuis Hugging Face, ensuite l'application fonctionne hors ligne."],
      ["Quelles langues peut-il lire ?", "Les voix téléchargeables couvrent plus de trente langues, dont le français, l'espagnol, l'anglais, le portugais, l'allemand, l'italien, le chinois, l'arabe et le russe. Pour le japonais et le coréen, utilisez les voix du système."],
      ["Puis-je télécharger l'audio ?", "Oui, en MP3 ou WAV. Choisissez le format à côté du bouton d'enregistrement et toute la lecture est générée en un seul fichier."]
    ],
    features: ["Lecteur de texte gratuit", "Voix hors ligne", "Export MP3 et WAV", "Sans inscription"]
  },

  de: {
    locale: "de_DE",
    title: "Text vorlesen lassen — kostenlos, ohne Anmeldung, im Browser",
    description:
      "Beliebigen Text einfügen und anhören. Kostenlos, ohne Konto und ohne Zeichenbegrenzung. Natürliche Stimmen, die einmal geladen werden und dann offline laufen; das Audio lässt sich als MP3 oder WAV speichern.",
    h1: "Text vorlesen lassen, kostenlos und ohne Anmeldung",
    intro:
      "Text Reader macht aus geschriebenem Text gesprochene Sprache, ohne nach Konto, E-Mail oder Karte zu fragen. Fügen Sie ein Kapitel, einen Artikel oder Ihre Notizen ein und drücken Sie auf Abspielen. Es gibt keine Zeichenbegrenzung und nichts wird hochgeladen: Der Text verlässt Ihr Gerät nicht.",
    ha: "Stimmen, die offline funktionieren",
    pa: "Neben den Stimmen Ihres Betriebssystems können Sie neuronale Stimmen in über dreißig Sprachen herunterladen. Jede wird einmal geladen, bleibt auf dem Gerät und läuft danach ohne Verbindung und ohne Dienst, der ausfallen könnte.",
    hb: "Der Lesung folgen und überall einsteigen",
    pb: "Der gelesene Satz und das aktuelle Wort werden hervorgehoben. Pausieren, auf ein beliebiges Wort klicken, und es geht dort weiter. Das Tempo reicht in festen Stufen von 0.25x bis 2.5x, wie bei einem Videoplayer.",
    hc: "Audio als Datei speichern",
    pc: "Die gesamte Lesung lässt sich als MP3 mit 128, 192 oder 320 kbps herunterladen, oder als unkomprimiertes WAV mit 16 oder 24 Bit für die spätere Bearbeitung.",
    hfaq: "Häufige Fragen",
    faq: [
      ["Ist es wirklich kostenlos?", "Ja. Kein Konto, keine Testphase, kein Textlimit. Es ist ein Open-Source-Projekt und läuft vollständig im Browser."],
      ["Wird mein Text auf einen Server geladen?", "Nein. Der Text bleibt im Browser. Die herunterladbaren Stimmen kommen einmalig von Hugging Face, danach läuft die Anwendung ohne Verbindung."],
      ["Welche Sprachen kann sie vorlesen?", "Die herunterladbaren Stimmen decken über dreißig Sprachen ab, darunter Deutsch, Spanisch, Englisch, Portugiesisch, Französisch, Italienisch, Chinesisch, Arabisch und Russisch. Für Japanisch und Koreanisch dienen die Systemstimmen."],
      ["Kann ich das Audio herunterladen?", "Ja, als MP3 oder WAV. Wählen Sie das Format neben der Schaltfläche zum Speichern; die gesamte Lesung wird als eine Datei erzeugt."]
    ],
    features: ["Kostenlos Text vorlesen", "Offline-Stimmen", "MP3- und WAV-Export", "Ohne Anmeldung"]
  },

  it: {
    locale: "it_IT",
    title: "Lettore di testo ad alta voce — gratis, senza registrazione",
    description:
      "Incolla qualsiasi testo e ascoltalo. Gratis, senza account e senza limiti di caratteri. Voci naturali che si scaricano una volta e funzionano offline, e puoi salvare l'audio in MP3 o WAV.",
    h1: "Lettore di testo ad alta voce, gratis e senza registrazione",
    intro:
      "Text Reader trasforma il testo scritto in voce senza chiedere account, e-mail o carta. Incolla un capitolo, un articolo o i tuoi appunti e premi riproduci. Non c'è limite di caratteri e nulla viene caricato da nessuna parte: il testo non lascia il tuo dispositivo.",
    ha: "Voci che funzionano offline",
    pa: "Oltre alle voci già installate nel sistema, puoi scaricare voci neurali in più di trenta lingue. Ognuna si scarica una sola volta, resta sul dispositivo e da lì in poi funziona senza connessione e senza servizi che possano interrompersi.",
    hb: "Segui la lettura e salta dove vuoi",
    pb: "La frase e la parola esatta che viene pronunciata sono evidenziate. Metti in pausa, clicca su una parola qualsiasi e riprende da lì. La velocità va da 0.25x a 2.5x a passi fissi, come un lettore video.",
    hc: "Salva l'audio in un file",
    pc: "L'intera lettura si può scaricare in MP3 a 128, 192 o 320 kbps, oppure in WAV non compresso a 16 o 24 bit se poi devi modificarla.",
    hfaq: "Domande frequenti",
    faq: [
      ["È davvero gratis?", "Sì. Nessun account, nessuna prova limitata, nessun tetto di testo. È un progetto open source e gira tutto nel browser."],
      ["Il mio testo finisce su un server?", "No. Il testo resta nel browser. Le voci scaricabili arrivano una volta da Hugging Face, poi l'applicazione funziona offline."],
      ["Quali lingue può leggere?", "Le voci scaricabili coprono più di trenta lingue, tra cui italiano, spagnolo, inglese, portoghese, francese, tedesco, cinese, arabo e russo. Per giapponese e coreano si usano le voci di sistema."],
      ["Posso scaricare l'audio?", "Sì, in MP3 o WAV. Scegli il formato accanto al pulsante di salvataggio e l'intera lettura viene generata in un solo file."]
    ],
    features: ["Lettore di testo gratuito", "Voci offline", "Esporta in MP3 e WAV", "Senza registrazione"]
  },

  zh: {
    locale: "zh_CN",
    title: "免费文字转语音朗读器 — 无需注册，浏览器内使用",
    description:
      "粘贴任意文字即可收听。免费、无需账号、没有字数限制。自然语音只需下载一次即可离线使用，还能把音频保存为 MP3 或 WAV。",
    h1: "免费的文字转语音朗读器，无需注册",
    intro:
      "Text Reader 把文字变成语音，不需要账号、邮箱或银行卡。粘贴一章书、一篇文章或你的笔记，点击播放即可。没有字数限制，也不会上传任何内容：文字始终留在你的设备上。",
    ha: "可离线使用的语音",
    pa: "除了系统自带的语音，你还可以下载三十多种语言的神经语音。每个语音只需下载一次，保存在你的设备上，之后无需联网，也不依赖任何可能中断的服务。",
    hb: "跟随朗读，随时跳转",
    pb: "正在朗读的句子和具体单词会高亮显示。暂停后点击任意词语，就从那里继续。速度从 0.25x 到 2.5x 分档调节，就像视频播放器。",
    hc: "把音频保存为文件",
    pc: "整段朗读可以下载为 128、192 或 320 kbps 的 MP3，也可以导出为 16 位或 24 位的无损 WAV，方便后续编辑。",
    hfaq: "常见问题",
    faq: [
      ["真的免费吗？", "是的。没有账号、没有试用期、没有字数上限。这是一个开源项目，全部在你的浏览器中运行。"],
      ["我的文字会上传到服务器吗？", "不会。文字只留在浏览器里。可下载的语音会从 Hugging Face 获取一次，之后应用可以完全离线运行。"],
      ["支持哪些语言？", "可下载的语音覆盖三十多种语言，包括中文、西班牙语、英语、葡萄牙语、法语、德语、意大利语、阿拉伯语和俄语。日语和韩语请使用系统语音。"],
      ["可以下载音频吗？", "可以，支持 MP3 和 WAV。在保存按钮旁选择格式，整段朗读会生成为一个文件。"]
    ],
    features: ["免费文字转语音", "离线语音", "导出 MP3 和 WAV", "无需注册"]
  },

  ja: {
    locale: "ja_JP",
    title: "無料の読み上げツール — 登録不要、ブラウザで使えるテキスト読み上げ",
    description:
      "テキストを貼り付けるだけで読み上げます。無料、アカウント不要、文字数制限なし。一度ダウンロードすればオフラインで動く自然な音声で、MP3 や WAV として保存できます。",
    h1: "無料のテキスト読み上げ、登録不要",
    intro:
      "Text Reader は書かれたテキストを音声に変えます。アカウントもメールもカードも不要です。本の一章、記事、自分のメモを貼り付けて再生するだけ。文字数の制限はなく、どこにもアップロードされません。テキストは端末から出ません。",
    ha: "オフラインで動く音声",
    pa: "OS に入っている音声に加えて、30 以上の言語のニューラル音声をダウンロードできます。各音声のダウンロードは一度だけで、端末に保存され、以降は接続も外部サービスも不要です。",
    hb: "読み上げを追い、好きな場所へ",
    pb: "読み上げ中の文と単語が강調されます。一時停止して任意の単語をクリックすれば、そこから続きます。速度は 0.25x から 2.5x まで段階的に、動画プレーヤーと同じ感覚です。",
    hc: "音声をファイルとして保存",
    pc: "読み上げ全体を 128、192、320 kbps の MP3、または編集用に 16 ビットか 24 ビットの非圧縮 WAV として保存できます。",
    hfaq: "よくある質問",
    faq: [
      ["本当に無料ですか？", "はい。アカウントも試用期間も文字数の上限もありません。オープンソースのプロジェクトで、すべてブラウザ内で動きます。"],
      ["テキストはサーバーに送られますか？", "いいえ。テキストはブラウザ内に留まります。ダウンロード音声は Hugging Face から一度取得するだけで、その後はオフラインで動作します。"],
      ["どの言語を読めますか？", "ダウンロード音声はスペイン語、英語、ポルトガル語、フランス語、ドイツ語、イタリア語、中国語、アラビア語、ロシア語など 30 以上の言語に対応します。日本語と韓国語は端末の音声をお使いください。"],
      ["音声をダウンロードできますか？", "はい、MP3 または WAV で保存できます。保存ボタンの横で形式を選ぶと、読み上げ全体が 1 つのファイルになります。"]
    ],
    features: ["無料の読み上げ", "オフライン音声", "MP3 と WAV の書き出し", "登録不要"]
  },

  ko: {
    locale: "ko_KR",
    title: "무료 텍스트 음성 변환 — 가입 없이 브라우저에서 읽어주기",
    description:
      "아무 텍스트나 붙여넣고 들어보세요. 무료, 계정 불필요, 글자 수 제한 없음. 한 번 내려받으면 오프라인으로 작동하는 자연스러운 음성이며 MP3나 WAV로 저장할 수 있습니다.",
    h1: "무료 텍스트 음성 변환, 가입 없이",
    intro:
      "Text Reader는 글을 음성으로 바꿔 줍니다. 계정도, 이메일도, 카드도 필요 없습니다. 책의 한 장이나 기사, 메모를 붙여넣고 재생을 누르기만 하면 됩니다. 글자 수 제한이 없고 어디에도 업로드되지 않습니다. 텍스트는 기기를 떠나지 않습니다.",
    ha: "오프라인으로 작동하는 음성",
    pa: "운영체제에 설치된 음성 외에도 30개 이상 언어의 신경망 음성을 내려받을 수 있습니다. 각 음성은 한 번만 내려받아 기기에 저장되며, 이후에는 인터넷 연결이나 외부 서비스 없이 작동합니다.",
    hb: "읽는 위치를 따라가고 원하는 곳으로",
    pb: "읽고 있는 문장과 단어가 강조됩니다. 일시정지한 뒤 아무 단어나 클릭하면 그 지점부터 이어집니다. 속도는 0.25x부터 2.5x까지 단계별로, 동영상 플레이어와 같습니다.",
    hc: "오디오를 파일로 저장",
    pc: "전체 낭독을 128, 192, 320 kbps MP3로 내려받거나, 나중에 편집할 계획이라면 16비트 또는 24비트 무압축 WAV로 저장할 수 있습니다.",
    hfaq: "자주 묻는 질문",
    faq: [
      ["정말 무료인가요?", "네. 계정도, 체험 기간도, 글자 수 제한도 없습니다. 오픈 소스 프로젝트이며 모두 브라우저에서 실행됩니다."],
      ["내 텍스트가 서버로 전송되나요?", "아니요. 텍스트는 브라우저에 머뭅니다. 내려받는 음성만 Hugging Face에서 한 번 가져오고, 이후에는 오프라인으로 동작합니다."],
      ["어떤 언어를 읽을 수 있나요?", "내려받을 수 있는 음성은 스페인어, 영어, 포르투갈어, 프랑스어, 독일어, 이탈리아어, 중국어, 아랍어, 러시아어 등 30개 이상 언어를 지원합니다. 한국어와 일본어는 시스템 음성을 사용하세요."],
      ["오디오를 내려받을 수 있나요?", "네, MP3 또는 WAV로 가능합니다. 저장 버튼 옆에서 형식을 고르면 전체 낭독이 하나의 파일로 만들어집니다."]
    ],
    features: ["무료 음성 변환", "오프라인 음성", "MP3 및 WAV 내보내기", "가입 불필요"]
  },

  ar: {
    locale: "ar_AR",
    title: "قارئ نصوص مجاني — تحويل النص إلى كلام بدون تسجيل",
    description:
      "الصق أي نص واستمع إليه. مجاني، بدون حساب وبدون حد للأحرف. أصوات طبيعية تُنزَّل مرة واحدة ثم تعمل دون اتصال، ويمكنك حفظ الصوت بصيغة MP3 أو WAV.",
    h1: "قارئ نصوص مجاني، بدون تسجيل",
    intro:
      "يحوّل Text Reader النص المكتوب إلى كلام دون أن يطلب حسابًا أو بريدًا أو بطاقة. الصق فصلاً أو مقالاً أو ملاحظاتك واضغط تشغيل. لا يوجد حد للأحرف ولا يُرفع أي شيء إلى أي مكان: النص لا يغادر جهازك.",
    ha: "أصوات تعمل دون اتصال",
    pa: "إلى جانب الأصوات المثبتة في نظامك، يمكنك تنزيل أصوات عصبية بأكثر من ثلاثين لغة. يُنزَّل كل صوت مرة واحدة ويبقى على جهازك، ثم يعمل بعد ذلك دون اتصال ودون الاعتماد على أي خدمة قد تتوقف.",
    hb: "تابع القراءة وانتقل إلى أي موضع",
    pb: "تُبرَز الجملة والكلمة التي تُقرأ في اللحظة نفسها. أوقف مؤقتًا، وانقر على أي كلمة لتكمل من هناك. تتدرج السرعة من 0.25x إلى 2.5x بخطوات ثابتة، مثل مشغّل الفيديو.",
    hc: "احفظ الصوت في ملف",
    pc: "يمكن تنزيل القراءة كاملة بصيغة MP3 بمعدل 128 أو 192 أو 320 كيلوبت، أو بصيغة WAV غير مضغوطة بعمق 16 أو 24 بت إذا كنت ستحررها لاحقًا.",
    hfaq: "أسئلة شائعة",
    faq: [
      ["هل هو مجاني فعلاً؟", "نعم. لا حساب ولا فترة تجريبية ولا حد للنص. المشروع مفتوح المصدر ويعمل بالكامل داخل متصفحك."],
      ["هل يُرفع نصي إلى خادم؟", "لا. يبقى النص في متصفحك. تُجلب الأصوات القابلة للتنزيل مرة واحدة من Hugging Face، وبعدها يعمل التطبيق دون اتصال."],
      ["ما اللغات التي يقرأها؟", "تغطي الأصوات القابلة للتنزيل أكثر من ثلاثين لغة، منها العربية والإسبانية والإنجليزية والبرتغالية والفرنسية والألمانية والإيطالية والصينية والروسية. أما اليابانية والكورية فتُستخدم لها أصوات النظام."],
      ["هل يمكنني تنزيل الصوت؟", "نعم، بصيغة MP3 أو WAV. اختر الصيغة بجوار زر الحفظ وتُنشأ القراءة كاملة في ملف واحد."]
    ],
    features: ["قارئ نصوص مجاني", "أصوات دون اتصال", "تصدير MP3 و WAV", "بدون تسجيل"]
  }

};
