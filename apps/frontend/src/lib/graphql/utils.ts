import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Normalize wallet address to lowercase for consistent querying
 */
export function normalizeWallet(wallet: string): string {
  return wallet.toLowerCase();
}

/**
 * Generate a random ID (legacy format)
 */
export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
}

/**
 * Generate an invite code
 */
export function generateInviteCode(userId: string, source: string): Promise<string> {
  // Simple implementation - generate a random code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return Promise.resolve(code);
}

/**
 * Get user invite stats
 */
export function getUserInviteStats(userId: string): Promise<any> {
  // Simple implementation - return mock stats
  return Promise.resolve({
    totalInvites: 0,
    usedInvites: 0,
    availableInvites: 5,
  });
}

/**
 * Validate an invite code
 */
export function validateInviteCode(
  code: string
): Promise<{ valid: boolean; ownerId?: string; ownerUsername?: string }> {
  // Simple implementation - always return valid for now
  return Promise.resolve({
    valid: true,
    ownerId: 'system',
    ownerUsername: 'system',
  });
}
