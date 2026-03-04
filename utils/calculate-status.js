// Helper function to determine attendance status based on punch-in time
const calculateStatus = (punchIn) => {
  const hour = punchIn.getHours();
  const minute = punchIn.getMinutes();

  if (hour < 11) return "Present";
  if (hour >= 11 && hour < 13) return "Half-Day";
  return "Late";
};
export default calculateStatus;
