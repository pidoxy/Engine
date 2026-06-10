import type { Gender, User, UserRole } from "@prisma/client";

const LEGACY_ROLE_MAP = {
  consultant: "CONSULTANT",
  organization: "ORGANIZATION",
  chw: "COMMUNITY_HEALTH_WORKER",
  community_health_worker: "COMMUNITY_HEALTH_WORKER",
} as const satisfies Record<string, UserRole>;

const LEGACY_GENDER_MAP = {
  male: "MALE",
  female: "FEMALE",
  other: "OTHER",
  prefer_not_to_say: "PREFER_NOT_TO_SAY",
} as const satisfies Record<string, Gender>;

export type SafeApiUser = Omit<User, "passwordHash" | "role"> & {
  role: string;
  roleKey: UserRole;
  organization: string | null;
};

export const normalizeUserRoleInput = (value: string): UserRole | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed in LEGACY_ROLE_MAP) {
    return LEGACY_ROLE_MAP[trimmed as keyof typeof LEGACY_ROLE_MAP];
  }

  const normalized = trimmed.toUpperCase() as UserRole;
  return Object.values<string>(LEGACY_ROLE_MAP).includes(normalized)
    ? normalized
    : null;
};

export const normalizeGenderInput = (value: string): Gender | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed in LEGACY_GENDER_MAP) {
    return LEGACY_GENDER_MAP[trimmed as keyof typeof LEGACY_GENDER_MAP];
  }

  const normalized = trimmed.toUpperCase() as Gender;
  return Object.values<string>(LEGACY_GENDER_MAP).includes(normalized)
    ? normalized
    : null;
};

export const toLegacyUserRole = (role: UserRole): SafeApiUser["role"] => {
  switch (role) {
    case "COMMUNITY_HEALTH_WORKER":
      return "chw";
    case "ORGANIZATION":
      return "organization";
    case "CONSULTANT":
    default:
      return "consultant";
  }
};

export const serializeUser = (
  user: Omit<User, "passwordHash">
): SafeApiUser => ({
  ...user,
  role: toLegacyUserRole(user.role),
  roleKey: user.role,
  organization: user.organizationId ?? null,
});
