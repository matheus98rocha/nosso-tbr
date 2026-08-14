export function levenshteinDistance(left: string, right: string): number {
  const leftLength = left.length;
  const rightLength = right.length;

  if (leftLength === 0) return rightLength;
  if (rightLength === 0) return leftLength;

  const previousRow = new Array<number>(rightLength + 1);
  const currentRow = new Array<number>(rightLength + 1);

  for (let j = 0; j <= rightLength; j += 1) {
    previousRow[j] = j;
  }

  for (let i = 1; i <= leftLength; i += 1) {
    currentRow[0] = i;
    const leftChar = left.charCodeAt(i - 1);

    for (let j = 1; j <= rightLength; j += 1) {
      const cost = leftChar === right.charCodeAt(j - 1) ? 0 : 1;
      const deletion = previousRow[j] + 1;
      const insertion = currentRow[j - 1] + 1;
      const substitution = previousRow[j - 1] + cost;
      currentRow[j] = Math.min(deletion, insertion, substitution);
    }

    for (let j = 0; j <= rightLength; j += 1) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[rightLength];
}
