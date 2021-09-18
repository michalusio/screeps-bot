export let messages: Log[] = [];

type Log = { message: unknown, repeats: number, time: number[] };

export function log(message: any): void {
  const msg = _.find(messages, m => m.message === message);
  if (msg) {
    msg.repeats++;
    msg.time.push(Game.time);
  }
  else messages.push({ message, repeats: 1, time: [Game.time] });
}

export function pruneLogs(): void {
  messages.forEach(m => {
    [...m.time].forEach((t, i) => {
      if (t <= Game.time - 10) {
        m.repeats--;
        m.time.splice(i, 1);
      }
    });
  });
  messages = messages.filter(msg => msg.repeats > 0);
}
