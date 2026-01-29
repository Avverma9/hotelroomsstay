/**
 * Get the current time in a specified time zone.
 * @param {string} timeZone - The time zone to get the current time for (e.g., "Asia/Kolkata").
 * @returns {string} - The current time formatted as "YYYY-MM-DD HH:mm:ss".
 */
export function getCurrentTime(timeZone) {
  const options = {
    timeZone: timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat([], options);
  const parts = formatter.formatToParts(new Date());

  const formattedTime =
    `${parts.find((p) => p.type === "year").value}-${
      parts.find((p) => p.type === "month").value
    }-${parts.find((p) => p.type === "day").value} ` +
    `${parts.find((p) => p.type === "hour").value}:${
      parts.find((p) => p.type === "minute").value
    }:${parts.find((p) => p.type === "second").value}`;

  return formattedTime;
}

// Example usage:
// const currentTime = getCurrentTime('Asia/Kolkata');
