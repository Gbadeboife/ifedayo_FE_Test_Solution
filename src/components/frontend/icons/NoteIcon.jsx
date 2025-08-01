import React from "react";

const NoteIcon = ({ width }) => (
  <svg
    width={width ?? "20"}
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.99935 13.3337V10.0003M9.99935 6.66699H10.0077M18.3327 10.0003C18.3327 14.6027 14.6017 18.3337 9.99935 18.3337C5.39698 18.3337 1.66602 14.6027 1.66602 10.0003C1.66602 5.39795 5.39698 1.66699 9.99935 1.66699C14.6017 1.66699 18.3327 5.39795 18.3327 10.0003Z"
      stroke="#475467"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default NoteIcon;
