import React from "react";

export default function LoadingButton({ loading, loadingEl, children, ...restProps }) {
  return (
    <button
      {...restProps}
      style={{ pointerEvents: loading ? "none" : undefined, cursor: loading ? "not-allowed" : undefined }}
    >
      {loading ? (
        loadingEl ?? (
          <div className="flex justify-center">
            <svg
              style={{ margin: "auto", background: "none", display: "block", shapeRendering: "auto" }}
              width="36px"
              height="36px"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid"
            >
              <path
                fill="none"
                stroke="#d0d5dd"
                strokeWidth="10"
                strokeDasharray="42.76482137044271 42.76482137044271"
                d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
                strokeLinecap="round"
                style={{ transform: "scale(1)", transformOrigin: "50px 50px" }}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  repeatCount="indefinite"
                  dur="1.6666666666666667s"
                  keyTimes="0;1"
                  values="0;256.58892822265625"
                ></animate>
              </path>
            </svg>
          </div>
        )
      ) : (
        <span>{children}</span>
      )}
    </button>
  );
}
