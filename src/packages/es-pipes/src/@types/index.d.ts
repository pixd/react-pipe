interface ImportMetaEnv {
  MODE: string;
  DEV: boolean;
  PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
