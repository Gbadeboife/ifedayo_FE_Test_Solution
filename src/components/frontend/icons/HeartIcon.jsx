import React from "react";

const HeartIcon = ({ isFav, stroke, favColor }) => {
  return (
    <svg
      width="20"
      height="17"
      viewBox="0 0 20 17"
      fill={isFav ? "#33d4b7" : "none"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.99413 2.77985C8.328 0.832 5.54963 0.308035 3.46208 2.09168C1.37454 3.87532 1.08064 6.85748 2.72 8.967C4.08302 10.7209 8.20798 14.4201 9.55992 15.6174C9.71117 15.7513 9.7868 15.8183 9.87502 15.8446C9.95201 15.8676 10.0363 15.8676 10.1132 15.8446C10.2015 15.8183 10.2771 15.7513 10.4283 15.6174C11.7803 14.4201 15.9052 10.7209 17.2683 8.967C18.9076 6.85748 18.6496 3.85656 16.5262 2.09168C14.4028 0.326798 11.6603 0.832 9.99413 2.77985Z"
        stroke={"#33d4b7"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default HeartIcon;
