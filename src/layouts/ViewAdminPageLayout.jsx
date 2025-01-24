import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/Icons";
import { GlobalContext } from "@/globalContext";
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";

const ViewAdminPageLayout = ({ title, backTo, children, table1, table2, deleteMessage, id, showDelete = true, name }) => {
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const navigate = useNavigate();

  return (
    <div className=" mx-auto rounded bg-white ">
      <div className="border px-5 py-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/admin/${backTo}`)}
            className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="ml-2">Back</span>
          </button>
        </div>
        <div className="flex justify-between">
          <h4 className="text-2xl font-bold"> {name ? `${title} - ${name}` : `View ${title}`}</h4>
          {showDelete ? (
            <button
              className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
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
              <TrashIcon className="h-6 w-6" />
              <span className="ml-2"> Delete {title}</span>
            </button>
          ) : null}
        </div>
      </div>
      <div className="border border-t-0 p-5">{children}</div>
    </div>
  );
};

export default ViewAdminPageLayout;
