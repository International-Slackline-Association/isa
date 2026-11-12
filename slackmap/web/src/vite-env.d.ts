/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_SLACKMAP_MAPBOX_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
