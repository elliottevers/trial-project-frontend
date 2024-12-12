export function scrambleArray<T>(array: T[]): T[] {
  const scrambled = [...array];

  for (let i = scrambled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [scrambled[i], scrambled[randomIndex]] = [scrambled[randomIndex], scrambled[i]];
  }

  return scrambled;
}