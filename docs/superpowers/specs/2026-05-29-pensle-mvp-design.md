# PensLE MVP Design

## Goal

Build a beautiful, ready-to-use React app for PensLE that runs in the browser today and remains ready for Capacitor/Android native storage later.

## Scope

The first version uses browser storage as the working persistence layer. It includes recording, AI-assisted note creation, local note browsing, note reading, a connection map, settings, and light/dark theme support.

## Navigation Names

The app avoids uncommon screen names in the UI:

- Record screen: "Capturar"
- Note list: "Notas"
- Connection map: "Conexoes"
- Settings: "Ajustes"

Internally, files may still use clear engineering names, but visible labels should use natural Portuguese.

## Experience

The first screen is "Capturar": a focused recording surface with a large circular microphone button. The button changes state while recording, shows a timer, and then shows processing stages after the user stops. If a Groq API key is configured, the app sends audio to Groq for transcription and interpretation. If not, or if the network/API fails, the app still creates a local note from the available text/fallback content.

"Notas" provides search, tag filtering, compact note cards, and access to each saved note. "Conexoes" shows notes and links in a force-directed graph. "Ajustes" stores the Groq key, language, model, audio retention preference, and theme mode.

## Note Format

Each created note keeps both versions for study and comparison:

- "Pensamento tratado": the AI-organized Markdown body.
- "Transcricao original": the raw transcript exactly as returned by transcription, with only minimal escaping required for display.

The app stores the original transcription in note metadata and also includes it as an explicit Markdown section. This preserves the learning trail while keeping the treated note useful.

## AI Pipeline

The transcription service focuses on faithful speech-to-text. The interpretation service receives the raw transcript plus recent note context, then returns strict JSON with title, summary, treated body, tags, candidate connections, and wikilinks.

The improved interpretation prompt emphasizes:

- Preserve the user's meaning and language.
- Separate raw transcription from treated Markdown.
- Do not invent tags or connections.
- Prefer no connection over a weak or speculative connection.
- Return valid JSON only.
- If the transcript is messy, organize without over-polishing or changing intent.

Connection validation happens after the LLM response: invalid note IDs are removed, duplicate links are ignored, weak connections are limited, and each new note gets at most five connections.

## Architecture

Use a Vite React + TypeScript app with focused services:

- `storageService`: browser storage repository with export/import-ready structures.
- `audioService` and `useRecorder`: MediaRecorder-based capture.
- `transcriptionService`: Groq Whisper call plus fallback behavior.
- `aiService`: interpretation prompt, JSON parsing, validation helpers.
- `markdownService`: frontmatter and comparison-section generation.
- `graphService`: convert notes/connections to graph data.

The browser storage repository should expose an interface that can later be implemented by Capacitor SQLite + Filesystem without changing UI code.

## Visual Design

PensLE should feel calm, direct, and polished. The default mode can be dark, but the user can choose light or dark in Ajustes. The palette must not rely only on purple; actions can use violet, recording uses soft red, and tags use deterministic colors from their names.

The app is mobile-first and responsive enough for desktop testing. It should avoid landing-page copy and open directly into the working app.

## Error Handling

The app must not lose a recording/transcript because AI processing fails. Errors produce clear messages and fallback notes:

- Missing API key: create a local note and guide the user to Ajustes.
- Transcription failure: keep the recording state recoverable and create a manual/fallback note when possible.
- Invalid LLM JSON: retry parsing/repair once, then save raw transcript as a note without connections.
- Mic denied: show an actionable message.

## Testing

Automated tests should cover the risky logic first:

- Markdown generation includes treated and raw sections.
- AI JSON parsing and connection validation reject invalid links.
- Browser storage persists notes and connections.
- Graph data generation maps note links correctly.

UI verification should include a production build and a browser check of the main flows.
