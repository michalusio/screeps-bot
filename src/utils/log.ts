export const messages: string[] = [];

export function log(message: string): void {
  messages.push(message);
}
