import { PlusCircleIcon } from "@heroicons/react/24/outline";
import React from "react";
import { NavLink } from "react-router-dom";
const AddButton = ({ link, text }) => {
  return (
    <>
      <NavLink
        to={link}
        className="ml-5 mb-1 flex items-center rounded  !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
      >
        <PlusCircleIcon className="h-6 w-6" />
        <span className="ml-2">{text ? text : ""}</span>
      </NavLink>
    </>
  );
};

export default AddButton;
