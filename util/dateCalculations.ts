export const sumMinutes = (date: Date, minutes: number): Date => {
  const epoch = date.getTime() + minutes * 60 * 1000;
  return new Date(epoch);
};
