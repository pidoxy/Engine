const KEY = 'aidcare_user';
const TOKEN_KEY = 'aidcare_token';

const ROLE_KEY_TO_ROLE = {
  CONSULTANT: 'consultant',
  COMMUNITY_HEALTH_WORKER: 'chw',
  ORGANIZATION: 'organization',
};

const ROLE_TO_ROLE_KEY = {
  consultant: 'CONSULTANT',
  chw: 'COMMUNITY_HEALTH_WORKER',
  community_health_worker: 'COMMUNITY_HEALTH_WORKER',
  organization: 'ORGANIZATION',
  CONSULTANT: 'CONSULTANT',
  COMMUNITY_HEALTH_WORKER: 'COMMUNITY_HEALTH_WORKER',
  ORGANIZATION: 'ORGANIZATION',
};

export function normalizeUser(user) {
  if (!user) return null;

  const organizationId = user.organizationId ?? user.organization ?? null;
  const roleKey =
    user.roleKey ??
    ROLE_TO_ROLE_KEY[user.role] ??
    (typeof user.role === 'string' ? user.role.toUpperCase() : null);
  const role = ROLE_KEY_TO_ROLE[roleKey] ?? user.role ?? null;
  const id = user.id ?? user._id ?? null;

  return {
    ...user,
    id,
    _id: id,
    role,
    roleKey,
    organizationId,
    organization: organizationId,
  };
}

export function getSavedUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  return raw ? normalizeUser(JSON.parse(raw)) : null;
}

export function saveUser(user) {
  localStorage.setItem(KEY, JSON.stringify(normalizeUser(user)));
}

export function getSavedToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearUser() {
  localStorage.removeItem(KEY);
}

export function clearAuth() {
  clearUser();
  localStorage.removeItem(TOKEN_KEY);
}

export function getUserOrganizationId(user) {
  return user?.organizationId ?? user?.organization ?? null;
}

export function isUserRole(user, role) {
  return normalizeUser(user)?.role === role;
}
