import React from "react";

const NotVerifiedIcon = ({ stroke }) => (
  <svg
    width="20"
    height="19"
    viewBox="0 0 20 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.10817 3.60866L15.8915 15.392M18.3332 9.50033C18.3332 14.1027 14.6022 17.8337 9.99984 17.8337C5.39746 17.8337 1.6665 14.1027 1.6665 9.50033C1.6665 4.89795 5.39746 1.16699 9.99984 1.16699C14.6022 1.16699 18.3332 4.89795 18.3332 9.50033Z"
      stroke={stroke ?? "white"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default NotVerifiedIcon;
