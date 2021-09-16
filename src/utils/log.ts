export let messages: [unknown, number][] = [];

export function log(message: any): void {
  messages.push([message, Game.time]);
}

export function pruneLogs(): void {
  messages = messages.filter(([, time]) => time > Game.time - 10);
}
