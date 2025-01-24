import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/Icons";
import { GlobalContext } from "@/globalContext";

const EditAdminPageLayout = ({ title, type, backTo, children, table1, table2, deleteMessage, id, showDelete = true }) => {
  const navigate = useNavigate();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  return (
    <div className=" rounded bg-white mx-auto ">
      <div className="border px-5 py-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/${type ? "account":"admin"}/${backTo}`)}
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
          <h4 className="text-2xl font-bold">Edit {title}</h4>
          {showDelete && (
            <button
              className="font-semibold text-sm pr-5 py-2.5 text-center inline-flex items-center mr-2 mb-2"
              onClick={() => {
                globalDispatch({
                  type: "SHOWMODAL",
                  payload: {
                    showModal: true,
                    modalShowMessage: deleteMessage,
                    modalShowTitle: "Confirm Changes",
                    type: "Delete",
                    modalBtnText: "Yes, Delete",
                    itemId: id,
                    table1: table1,
                    table2: table2,
                    backTo: `/admin/${backTo}`,
                  },
                });
              }}
            >
              <Icon
                type="trash"
                variant="two"
                className="stroke-[#667085] h-4 w-4"
              />{" "}
              <span className="ml-2"> Delete {title}</span>
            </button>
          )}
        </div>
      </div>
      <div className="border p-5 border-t-0">{children}</div>
    </div>
  );
};

export default EditAdminPageLayout;
