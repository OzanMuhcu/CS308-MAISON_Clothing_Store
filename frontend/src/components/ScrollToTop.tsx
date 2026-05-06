import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Resets scroll to the top of the page on every route change. Without this,
// React Router preserves the previous page's scroll position when the user
// navigates, which feels broken on long product/landing pages.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
