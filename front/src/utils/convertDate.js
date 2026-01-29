export function formatDate(dateInput) {
  if (!dateInput) return "N/A";

  const date = new Date(dateInput);
  if (isNaN(date)) return "Invalid date";

  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "long" });
  const year = date.getFullYear();

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${day}${getOrdinal(day)} ${month} ${year}`;
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