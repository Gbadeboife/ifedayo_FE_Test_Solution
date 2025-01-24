import React from "react";
import Icon from "@/components/Icons";
import { useNavigate } from "react-router-dom";

const AddAdminPageLayout = ({ title, backTo, children }) => {
  const navigate = useNavigate();
  return (
    <div className=" rounded bg-white mx-auto ">
      <div className="border px-5 py-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/admin/${backTo}`)}
            className="font-semibold text-sm pr-5 py-2.5 text-center inline-flex items-center mr-2 mb-2"
          >
            <Icon
              type="arrow"
              variant="narrow-left"
              className="stroke-[#667085] h-4 w-4"
            />{" "}
            <span className="ml-2">Back</span>
          </button>
        </div>
        <div className="flex justify-between">
          <h4 className="text-2xl font-bold">Add New {title}</h4>
        </div>
      </div>
      <div className="border p-5 border-t-0">{children}</div>
    </div>
  );
};

export default AddAdminPageLayout;
