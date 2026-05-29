# PensLE

PensLE é um app React + TypeScript, pronto para rodar no navegador e preparado para evoluir para Capacitor/Android. Ele captura áudio, transcreve com Groq quando há API key, interpreta o pensamento em Markdown, preserva a transcrição original para comparação e salva tudo localmente.

## Rodar no navegador

```bash
npm install
npm run dev
```

Abra a URL exibida pelo Vite.

## API key da Groq

No app, vá em **Ajustes** e preencha a API key. Sem chave, o PensLE ainda cria notas locais com fallback, mas não faz transcrição/interpretação via IA.

## Fluxo atual

- **Capturar**: grava áudio pelo navegador e cria uma nota.
- **Notas**: busca, filtra por tags, abre e exclui notas.
- **Conexões**: mostra o mapa semântico das relações validadas.
- **Ajustes**: salva API key, idioma, modelo, retenção de áudio e tema claro/escuro.

Se uma captura for feita antes de configurar a API key, a nota pode ser transcrita e tratada depois. Abra a nota e toque em **Transcrever e tratar**. Para novas capturas, o áudio é salvo no armazenamento local do navegador quando **Manter áudios originais** está ativo.

Cada nota mantém duas seções:

- **Pensamento tratado**: Markdown organizado pela IA ou fallback.
- **Transcrição original**: texto bruto preservado para estudo e comparação.

## Build

```bash
npm run build
```

## Capacitor

A configuração inicial está em `capacitor.config.ts` com:

- `appId`: `com.otgan.pensle`
- `appName`: `PensLE`
- `webDir`: `dist`

Próximos passos naturais para Android:

```bash
npm run android:sync
npm run android:open
```

O projeto Android nativo fica em `android/`. A permissão de microfone (`RECORD_AUDIO`) já está no `AndroidManifest.xml`.

Depois disso, substituir a camada `BrowserStorageService` por SQLite + Filesystem mantendo a mesma interface de serviços.
