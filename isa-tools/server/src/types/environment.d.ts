declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ISA_DOCUMENTS_TABLE_NAME: string;
      ISA_DOCUMENTS_TRUSTED_SERVICE_API_KEY: string;
      TEMPORARY_UPLOADS_S3_BUCKET: string;
    }
  }
}

export {};
