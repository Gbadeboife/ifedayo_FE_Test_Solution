import React, { useState } from "react";
import CopyIcon from "@/components/frontend/icons/CopyIcon";
import PencilIcon from "@/components/frontend/icons/PencilIcon";
import RecurringIcon from "@/components/frontend/icons/RecurringIcon";
import ResetIcon from "@/components/frontend/icons/ResetIcon";
import { useSpaceContext } from "./spaceContext";
import moment from "moment";
import { useFieldArray, useForm } from "react-hook-form";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import CustomizedIcon from "@/components/frontend/icons/CustomizedIcon";
import { daysMapping, fullDaysMapping, hourlySlots, formatAMPM } from "@/utils/date-time-utils";
import Icon from "@/components/Icons";
import { useEffect } from "react";
import { parseJsonSafely } from "@/utils/utils";
import { usePropertySpace } from "@/hooks/api";
import MkdSDK from "@/utils/MkdSDK";

let sdk = new MkdSDK();

const EditScheduleDay = ({ selectedDate, date, id, schedule_id, selected_id, isDirty, setIsDirty, selectedTemplate, activeStartDate }) => {

  const { spaceData, dispatch } = useSpaceContext();
  // const showOptions = selectedDate.getDate() == date.getDate();
  const [showOptions, setShowOptions] = useState(false);

  const [editPopup, setEditPopup] = useState(false);
  const [slotDates, setSlotDates] = useState([]);
  const showEditPopup = useDelayUnmount(editPopup, 300);
  const dayFormatted = moment(date).format("MM/DD/YY");

  async function returnSpaceDetails() {
    sdk.setTable("property_spaces_schedule_template")
    const data = await sdk.callRestAPI({}, "GETALL")
    const mainData = data?.list.find((space) => space.property_spaces_id === Number(id))
    if (mainData?.customSlots) {
      setSlotDates(JSON.parse(mainData?.custom_slots))
    }

  }

  useEffect(() => {
    returnSpaceDetails()
  }, [editPopup])

  // get slots from context or template
  let slots = Array.isArray(spaceData?.customSlots[dayFormatted] ?? slotDates[dayFormatted])
    ? spaceData?.customSlots[dayFormatted] ?? slotDates[dayFormatted]
    : selectedTemplate[daysMapping[date.getDay()]] == 1 && Array.isArray(parseJsonSafely(selectedTemplate.slots))
      ? parseJsonSafely(selectedTemplate.slots)
      : [];

  let isCustom = Array.isArray(spaceData?.customSlots[dayFormatted] ?? slotDates[dayFormatted]);

  const { handleSubmit, register, control, getValues, setValue } = useForm({
    defaultValues: {
      custom_slot: slots.map((slot) => ({ start: formatAMPM(slot.start), end: formatAMPM(slot.end) })),
    },
  });
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control,
    name: "custom_slot",
  });
  useEffect(() => {
    setShowOptions(false);
  }, [selectedDate]);

  const onSubmit = async (data) => {
    dispatch({
      type: "SET_DAY_SLOT",
      payload: {
        day: dayFormatted,
        slots: data.custom_slot.map((time) => ({ start: new Date(`${dayFormatted} ${time.start}`).toISOString(), end: new Date(`${dayFormatted} ${time.end}`).toISOString() })),
      },
    });
    sdk.setTable("property_spaces_schedule_template");
    await sdk.callRestAPI(
      {
        id: schedule_id && schedule_id,
        schedule_template_id: selected_id && selected_id,
        custom_slots: JSON.stringify(spaceData?.customSlots),
      },
      "PUT",
    );
    setEditPopup(false);
  };

  const resetToTemplate = (e) => {
    e.stopPropagation();
    dispatch({ type: "CLEAR_DAY_SLOT", payload: dayFormatted });
  };

  const copyFromPreviousWeek = (e) => {
    e.stopPropagation();
    dispatch({ type: "INHERIT_DAY_SLOT", payload: dayFormatted });
  };

  return (
    <div className={`${showOptions ? "" : ""} ${date.getDay() == 0 ? "" : "border-r-0"} border relative min-h-[180px] border-t-0 schedule-day`}>
      <div className="border-b py-2 px-[14px] flex justify-between">
        <h5 className="font-semibold">{date.getDate()}</h5>
        {isCustom ? <CustomizedIcon /> : <RecurringIcon />}
      </div>
      <div className="px-[8px] py-4 flex flex-col items-start gap-3">
        {slots.slice(0, 3).map((sl, idx) => (
          <p key={idx}>{formatAMPM(sl.start) + " - " + formatAMPM(sl.end)}</p>
        ))}
        {slots.length > 3 && <span className="font-semibold"> + {slots.length - 3} More</span>}
      </div>
      {dayFormatted == moment(selectedDate).format("MM/DD/YY") && (
        <button
          className="flex border-2 border-red-400 p-2 w-full justify-end bottom-4 absolute options-btn"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowOptions(true);
          }}
        >
          <div className="rotate-90">
            <Icon type="dots" />
          </div>
        </button>
      )}

      {showOptions && (
        <div
          className={`pop-in absolute top-1/2 ${date.getDay() == 0 ? "-left-1/2" : "left-1/2"
            }  min-w-[223px] border border[#EAECF0] flex flex-col bg-white z-10 rounded-md schedule-options whitespace-nowrap`}
        >
          <button
            className="flex gap-[15px] hover:bg-gray-200 w-full p-3"
            onClick={() => {
              setEditPopup(true);
              setValue(
                "custom_slot",
                slots.map((slot) => ({ start: formatAMPM(slot.start), end: formatAMPM(slot.end) })),
              );
            }}
          >
            <PencilIcon stroke="#98A2B3" />
            <span>Edit</span>
          </button>
          {selectedTemplate.template_name && (
            <button
              className="flex gap-[15px] hover:bg-gray-200 w-full p-3"
              onClick={resetToTemplate}
            >
              <ResetIcon />
              <span>Reset to {selectedTemplate.template_name}</span>
            </button>
          )}

          <button
            className="flex gap-[15px] hover:bg-gray-200 w-full p-3"
            onClick={copyFromPreviousWeek}
          >
            <CopyIcon />
            <span>Copy from previous {fullDaysMapping[date.getDay()]}</span>
          </button>
        </div>
      )}
      <div
        className={`${showEditPopup ? "flex" : "hidden"} popup-container  items-center justify-center normal-case`}
        onClick={() => setEditPopup(false)}
      >
        <form
          className={`${editPopup ? "pop-in" : "pop-out"} bg-white p-5 md:px-5 px-3 rounded-lg w-[410px] max-w-[80%]`}
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex justify-between items-center mb-[18px]">
            <h3 className="text-2xl font-semibold">Edit Day</h3>
            <button
              type="button"
              onClick={() => setEditPopup(false)}
            >
              &#10006;
            </button>
          </div>
          <div className="">
            <div className="review-scroll min-h-[200px] max-h-[40vh] overflow-y-auto custom-calendar-scroll">
              {fields.map((field, index) => (
                <div
                  className="flex gap-6 mb-[32px]"
                  key={field.id}
                >
                  <div className="flex-grow flex justify-between">
                    <select
                      className="border bg-white cursor-pointer py-2 px-2 min-w-[150px]"
                      {...register(`custom_slot.${index}.start`)}
                    >
                      {hourlySlots.map((time) => (
                        <option key={time}>{time}</option>
                      ))}
                    </select>
                    <select
                      className="border bg-white cursor-pointer py-2 px-2 min-w-[150px]"
                      {...register(`custom_slot.${index}.end`)}
                    >
                      {hourlySlots.map((time) => (
                        <option key={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                  >
                    &#x2715;
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="text-sm text-[#1570EF] font-semibold mb-[32px]"
              onClick={() => append({ start: "05:00 am", end: "07:00 am" })}
            >
              + Add another time slot
            </button>
          </div>
          <br />
          <button
            type="submit"
            className="login-btn-gradient text-white tracking-wide outline-none focus:outline-none rounded py-2  mt-4 w-full"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditScheduleDay;
