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
