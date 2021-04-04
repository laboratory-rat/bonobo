export const arrayChunk = <T>(array: T[], size: number): T[][] => {
  if (size <= 0) return [array];
  const subArray = size <= array.length
    ? array.splice(0, size)
    : [...array];

  if (!array.length) return [subArray];
  return [
    subArray,
    ...arrayChunk(array, size)
  ];
};