declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ISA_DOCUMENTS_TABLE_NAME: string;
      TEMPORARY_UPLOADS_S3_BUCKET: string;
    }
  }
}

export {};
