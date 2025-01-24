import { useCallback, useEffect, useState } from "react";

export default function useScrollDirection() {
  const [y, setY] = useState(document.scrollingElement.scrollHeight);
  const [scrollDirection, setScrollDirection] = useState("NONE");

  const handleNavigation = useCallback(
    (e) => {
      if (y > window.scrollY) {
        setScrollDirection("UP");
      } else if (y < window.scrollY) {
        setScrollDirection("DOWN");
      }
      setY(window.scrollY);
    },
    [y],
  );

  useEffect(() => {
    window.addEventListener("scroll", handleNavigation);

    return () => {
      window.removeEventListener("scroll", handleNavigation);
    };
  }, [handleNavigation]);
  return scrollDirection;
}
