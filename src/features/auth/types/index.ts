export interface ApiResponse<T> {
  success: boolean;
  message: string;
  exceptionMessage: string;
  data: T;
  errors: string[];
  timestamp: string;
  statusCode: number;
  className: string;
}

export interface BranchErp {
  subeKodu: number;
  unvan: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponseData {
  token: string;
  userId: number;
  sessionId: string;
  rememberMe: boolean;
}

export type LoginResponsePayload = string | LoginResponseData;
export type LoginResponse = ApiResponse<LoginResponsePayload>;
export type BranchListResponse = ApiResponse<BranchErp[]>;
export type ForgotPasswordResponse = ApiResponse<string>;
export type ResetPasswordResponse = ApiResponse<boolean>;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface User {
  id: number;
  email: string;
  /** JWT `name` — genelde giriş kullanıcı adı */
  name: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
}

export interface JWTPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"?: string;
  exp: number;
  /** Kısa claim isimleri (backend’e göre JWT içinde düz alan) */
  firstName?: string;
  lastName?: string;
  fullName?: string;
  given_name?: string;
  family_name?: string;
}
