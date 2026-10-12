interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL?: string;
  readonly VITE_FILE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
