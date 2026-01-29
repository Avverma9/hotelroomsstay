// src/utils/scrollToTop.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top of the page when location changes
    window.scrollTo(0, 0);

    // Optionally, if you want to ensure that scroll restoration is handled properly, you can also manipulate the history state.
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
  }, [location]);

  return null;
};

export default ScrollToTop;
