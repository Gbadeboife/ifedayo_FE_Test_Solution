import React from "react";

const Hamburger = ({ stroke }) => (
  <svg
    width="24"
    height="17"
    viewBox="0 0 24 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.5 8.5H22.5M1.5 1.5H22.5M1.5 15.5H22.5"
      stroke={stroke ?? "white"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Hamburger;
