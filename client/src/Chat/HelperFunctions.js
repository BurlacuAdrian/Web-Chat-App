function getDaySuffix(day) {
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function formatUTCDate(utcDate) {
  const date = new Date(utcDate);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();

  const hour = date.getHours();
  const minutes = date.getMinutes();

  const formattedHour = hour < 10 ? '0' + hour : hour;
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  const daySuffix = getDaySuffix(date.getDate());
  return `${formattedHour}:${formattedMinutes}, ${day}${getDaySuffix(day)} of ${month} ${year}`
}