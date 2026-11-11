export interface Instructor {
  email?: string;
  certId?: string;
  name?: string;
  country?: string;
  level?: string;
  expirationDate?: string;
}

export type Rigger = Omit<Instructor, 'level'>;

export interface CertifiedGear {
  certId?: string;
  email?: string;
  brand?: string;
  modelName?: string;
  standard?: string;
  productLink?: string;
  picture1?: string;
  picture2?: string;
  productType?: string;
  modelVersion?: string;
  releaseYear?: string;
  manualLink?: string;
  testingLaboratory?: string;
  testDate?: string;
  standardVersion?: string;
}

export interface EquipmentWarning {
  id?: string;
  status?: string;
  manufacturer?: string;
  model?: string;
  productType?: string;
  productImage?: string;
  date?: string;
  inProduction?: string;
  description?: string;
  solution?: string;
  link1?: string;
  link2?: string;
}

export interface SairReport {
  timestamp?: string;
  narrative?: string;
  analysis?: string;
  countryName?: string;
  incidentDate?: string;
  slacklineType?: string;
  incidentType?: string;
  severity?: string;
  injuryType?: string;
  injuryLocation?: string;
  filters?: string;
  coverImage?: string;
  images: string[];
}

export interface WorldRecord {
  certId?: string;
  date?: string;
  recordType?: string;
  name?: string;
  country?: string;
  specs?: string;
  link1?: string;
  link2?: string;
  category?: string;
  extra?: string;
  typeOfRecord?: string;
  typeOfLine?: string;
}

export interface WorldFirst {
  certId?: string;
  date?: string;
  description?: string;
  name?: string;
  country?: string;
  link1?: string;
  link2?: string;
  category?: string;
  typeOfLine?: string;
}

export interface VerifyResult {
  isVerified: boolean;
  subject?: string;
  issuedAt?: string;
  expiresAt?: string;
  content?: string;
}
