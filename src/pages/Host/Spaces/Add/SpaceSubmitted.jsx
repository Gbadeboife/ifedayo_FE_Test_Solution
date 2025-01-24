import React from "react";
import { Link } from "react-router-dom";
import GreenCheckIcon from "@/components/frontend/icons/GreenCheckIcon";

const SpaceSubmitted = () => (
  <div className="min-h-screen md:mt-0 mt-16">
    <div className="flex justify-between items-center mb-[28px]">
      <div className="flex items-center">
        <GreenCheckIcon size="35" />
        <h1 className="md:text-4xl text-2xl font-semibold">Space successfully submitted</h1>
      </div>
      <Link
        to="/account/my-spaces"
        className="font-semibold text-[#344054] text-sm outline-none focus:outline-none rounded py-2 px-4 border-2 border-[#98A2B3] whitespace-nowrap"
      >
        Go to my spaces
      </Link>
    </div>
    <div className="bg-[#F9FAFB] border-[#EAECF0] rounded-lg border px-[24px] py-[16px] max-w-3xl mb-[32px]">
      <h3 className="text-lg font-semibold flex gap-2 items-center mb-2">
        <svg
          width="20"
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
        <span>What's next?</span>
      </h3>
      <p className="ml-6 text-sm leading-relaxed">Our team will review the space and get back to you shortly. It usually takes up to 24 hrs. We will email you when there’s an update..</p>
    </div>
  </div>
);

export default SpaceSubmitted;
