import { GlobalContext } from "@/globalContext";
import React from "react";
import { useContext } from "react";

export default function LoadingSpinner() {
  const { state } = useContext(GlobalContext);

  if (!state.loading) return null;

  return (
    <div className="popup-container flex items-center justify-center">
      <div className="">
        <svg
          style={{ margin: "auto", background: "transparent", display: " block", shapeRendering: "auto" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid"
          className="md:w-[100px] md:h-[100px] w-[80px] h-[80px]"
        >
          <path
            fill="none"
            stroke="#d0d5dd"
            strokeWidth="6"
            strokeDasharray="42.76482137044271 42.76482137044271"
            d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
            strokeLinecap="round"
            style={{ transform: "scale(0.8)", transformOrigin: "50px 50px" }}
          >
            <animate
              attributeName="stroke-dashoffset"
              repeatCount="indefinite"
              dur="1.882051282051282s"
              keyTimes="0;1"
              values="0;256.58892822265625"
            ></animate>
          </path>
        </svg>
      </div>
    </div>
  );
}
