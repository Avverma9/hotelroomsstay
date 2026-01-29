export const handlePrint = () => {
  const printStylesheet = document.createElement("link");
  printStylesheet.rel = "stylesheet";
  printStylesheet.type = "text/css";
  printStylesheet.href = "path-to-your-print-stylesheet.css";

  document.head.appendChild(printStylesheet);
  window.print();
  document.head.removeChild(printStylesheet);
};
