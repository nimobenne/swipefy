export function isAdmin(userId: string): boolean {
  const adminId = process.env.ADMIN_USER_ID?.trim();
  if (!adminId) return false;
  return userId.trim() === adminId;
}
