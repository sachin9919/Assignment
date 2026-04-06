export type Role = "viewer" | "analyst" | "admin";
export type UserStatus = "active" | "inactive";

export interface JwtUser {
  id: string;
  role: Role;
}

