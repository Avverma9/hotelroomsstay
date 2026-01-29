export function formatDate(dateString) {
  // Split the date string into an array of parts.
  const parts = dateString.split("T");

  // Get the date part of the string.
  const datePart = parts[0];

  // Split the date part into an array of parts.
  const dateParts = datePart.split("-");

  // Get the year, month, and day parts of the date.
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];

  // Return the date in the DD-MM-YYYY format.
  return `${day}-${month}-${year}`;
}

//Get current Date
export function getCurrentDate() {
  const today = new Date();
  let month = (today.getMonth() + 1).toString();
  let day = today.getDate().toString();

  if (month.length === 1) {
    month = "0" + month;
  }
  if (day.length === 1) {
    day = "0" + day;
  }

  return `${today.getFullYear()}-${month}-${day}`;
}
// Utility function to format date
// Utility function to format date string
export function formatDateWithOrdinal (dateString){
  // Parse the date string
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date string");
  }

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' }); // 'short' gives abbreviated month name
  const year = date.getFullYear();

  // Function to determine the ordinal suffix
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th'; // 'th' for 4th to 20th
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Format the date with the ordinal suffix
  const ordinalSuffix = getOrdinalSuffix(day);
  return `${day}${ordinalSuffix} ${month} ${year}`;
};


