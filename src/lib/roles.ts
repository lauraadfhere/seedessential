export type AccountKind = "farmer" | "user" | "expert" | "merchant";

export function isProviderRole(role?: string) {
  return role === "provider" || role === "business";
}

export function isExpertRole(role?: string) {
  return role === "expert";
}

/** Maps public signup kinds to Parse `_User.role`. */
export function roleForAccountKind(kind: AccountKind) {
  if (kind === "expert") return "expert";
  if (kind === "merchant") return "provider";
  return "customer";
}

export function homePathForRole(role?: string) {
  if (role === "admin") return "/admin";
  if (isProviderRole(role)) return "/provider";
  if (isExpertRole(role)) return "/expert";
  return "/dashboard";
}

export function audienceLabel(role?: string, accountKind?: string) {
  if (isProviderRole(role)) return "Merchant";
  if (isExpertRole(role)) return "Expert";
  if (role === "admin") return "Admin";
  if (accountKind === "farmer") return "Farmer";
  if (accountKind === "user") return "Member";
  return "Grower";
}

export const SIGNUP_ACCOUNT_TYPES: {
  kind: AccountKind;
  titleKey: string;
  detailKey: string;
}[] = [
  { kind: "farmer", titleKey: "auth.farmerTitle", detailKey: "auth.farmerDetail" },
  { kind: "user", titleKey: "auth.userTitle", detailKey: "auth.userDetail" },
  { kind: "expert", titleKey: "auth.expertTitle", detailKey: "auth.expertDetail" },
  { kind: "merchant", titleKey: "auth.merchantTitle", detailKey: "auth.merchantDetail" },
];
