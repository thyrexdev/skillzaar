export type Role = "CLIENT" | "FREELANCER" | "ADMIN";

export interface AuthPayload {
  userId: string;
  role: Role;
}
