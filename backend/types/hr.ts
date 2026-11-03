export interface HRTokenPayload {
  userId: string;
  email: string;
  role: 'hr';
  iat?: number;
  exp?: number;
}

export interface HRPrincipal {
  id: string;
  email: string;
  role: 'hr' | 'admin';
  fullName?: string;
  company?: string;
  designation?: string;
}

export interface HRRegisterInput {
  fullName: string;
  email: string;
  password: string;
  company?: string;
  designation?: string;
  experience?: number | string;
}

export interface HRAuthResponse {
  message?: string;
  token: string;
  user: HRPrincipal;
}

