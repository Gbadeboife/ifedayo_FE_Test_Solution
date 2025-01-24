import React, { useState } from "react";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { parseJsonSafely } from "@/utils/utils";
import PencilIcon from "./icons/PencilIcon";
import TrashIcon from "./icons/TrashIcon";
import { formatAMPM, daysMapping } from "@/utils/date-time-utils";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import ThreeDotsMenu from "./ThreeDotsMenu";
import EditTemplateModal from "@/pages/Host/Spaces/Add/EditTemplateModal";

const AvailabilityTemplate = ({ data, forceRender, selectedTemplate, setSelectedTemplate }) => {
  const [editPopup, setEditPopup] = useState(false);
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const parsedSlots = parseJsonSafely(data.slots, []);

  async function deleteTemplate(id) {
    globalDispatch({ type: "START_LOADING" });
    try {
      await callCustomAPI("host/schedule-slot/template", "delete", { id }, "");
      if (forceRender) forceRender(new Date());
    } catch (err) {
      globalDispatch({ type: "STOP_LOADING" });
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  return (
    <div className="mb-[44px] flex items-center justify-between rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-[12px]">
      <div className="w-full">
        <div className="flex justify-between lg:justify-start">
          <div className="lg:min-w-[370px]">
            <h3 className="text-xl font-semibold">{data.template_name}</h3>
            <p className="capitalize">
              (
              {daysMapping
                .filter((day) => data[day] == 1)
                .map((day, i, arr) => {
                  return day + (i == arr.length - 1 ? "" : ", ");
                })}
              )
            </p>
            <div className="block md:hidden">
              <br />
              <ThreeDotsMenu
                items={[
                  {
                    label: "Edit",
                    icon: <PencilIcon />,
                    onClick: () => setEditPopup(true),
                  },
                  {
                    label: "Delete",
                    icon: <TrashIcon />,
                    onClick: () => deleteTemplate(data.id),
                  },
                ]}
                menuClassName="right-[unset] left-0 origin-top-left"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-[32px] lg:flex-nowrap lg:justify-start">
            {Array.isArray(parsedSlots) &&
              parsedSlots.slice(0, 2).map((slot, idx) => (
                <div
                  className="whitespace-nowrap"
                  key={idx}
                >
                  <p className="text-sm">Slot {idx + 1}:</p>
                  <p className="font-semibold">
                    {formatAMPM(slot.start)} - {formatAMPM(slot.end)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="hidden lg:flex">
        <button
          onClick={() => setEditPopup(true)}
          className={`inline-flex w-full items-center gap-2 px-4 py-2 text-center text-sm`}
        >
          <PencilIcon />
          Edit
        </button>
        <button
          onClick={() => deleteTemplate(data.id)}
          className={`inline-flex w-full items-center gap-2 px-4 py-2 text-center text-sm`}
        >
          <TrashIcon />
          Delete
        </button>
      </div>

      <EditTemplateModal
        data={data}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        forceRender={forceRender}
        onSuccess={() => {
          if (forceRender) forceRender();
        }}
        modalOpen={editPopup}
        closeModal={() => setEditPopup(false)}
      />
    </div>
  );
};

export default AvailabilityTemplate;
