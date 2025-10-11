/**
 * @nocena/indexer
 * A shared package for the Nocena monorepo
 */

export function greet(name: string): string {
  return `Hello, ${name}! Welcome to Nocena.`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export class Indexer {
  private items: string[] = [];

  add(item: string): void {
    this.items.push(item);
  }

  getAll(): string[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }

  count(): number {
    return this.items.length;
  }
}

export default {
  greet,
  capitalize,
  Indexer,
};

