export function scrambleArray<T>(array: T[]): T[] {
  // Create a copy of the array to avoid mutating the original
  const scrambled = [...array];

  for (let i = scrambled.length - 1; i > 0; i--) {
    // Generate a random index between 0 and i
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // Swap elements at i and randomIndex
    [scrambled[i], scrambled[randomIndex]] = [scrambled[randomIndex], scrambled[i]];
  }

  return scrambled;
}