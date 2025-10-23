export function getDateRange(date: string, frequency: string): { startDate: Date; endDate: Date } {
  const targetDate = new Date(date);
  let startDate: Date;
  let endDate: Date;

  if (frequency === 'daily') {
    startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    endDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23, 59, 59
    );
  } else if (frequency === 'weekly') {
    const dayOfWeek = targetDate.getDay();
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    startDate = monday;
    endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 6);
    endDate.setHours(23, 59, 59);
  } else {
    startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
  }

  return { startDate, endDate };
}
