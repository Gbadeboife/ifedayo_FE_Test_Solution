import React, { useState } from "react";

const FaqAccordion = ({ data }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-[16px]">
      <div className="mb-[12px]">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center"
        >
          <svg
            width="14"
            height="8"
            viewBox="0 0 14 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${open ? "rotate-180" : "rotate-90"} duration-200`}
          >
            <path
              d="M13 7L7 1L1 7"
              stroke="#475467"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-semibold ml-4 text-[16px]">{data.question}</span>
        </button>
      </div>
      <p
        className={`ml-8 duration-500 overflow-hidden ${open ? `pointer-events-auto max-h-[300px]` : "max-h-0 pointer-events-none"}`}
        dangerouslySetInnerHTML={{ __html: data.answer }}
      ></p>
    </div>
  );
};

export default FaqAccordion;
