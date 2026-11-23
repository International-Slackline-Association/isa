/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_SLACKMAP_MAPBOX_TOKEN: string;
  readonly VITE_APP_STAGE: import('./stages').Stage;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
