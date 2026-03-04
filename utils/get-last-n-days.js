const getLastNDates = (n) => {
  const dates = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(new Date(d.setHours(0, 0, 0, 0))); // start of day
  }
  return dates;
};
export default getLastNDates;
