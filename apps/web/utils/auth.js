// export type Role = 'Admin' | 'CHW' | 'Consultant';

// export type User = {
//   name: string;
//   orgId: string;
//   role: Role;
// };

const KEY = 'aidcare_user';

export function getSavedUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY);
}
