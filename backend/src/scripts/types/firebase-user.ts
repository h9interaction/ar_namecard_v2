export interface FirebaseUser {
  email: string;
  englishName: string;
  koreanName: string;
  organization: string;
  position: string;
  role: string;
  imageUrl: string;
}

export interface MigrationResult {
  success: boolean;
  userId?: string;
  email: string;
  arId?: string;
  error?: string;
}

export interface MigrationReport {
  total: number;
  success: number;
  failed: number;
  results: MigrationResult[];
  startTime: Date;
  endTime: Date;
}