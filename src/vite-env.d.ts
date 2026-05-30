/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY?: string;
  readonly API_KEY_GROQ?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
