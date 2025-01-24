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
import { useEffect } from "react";
import Icon from "@/components/Icons";
import { parseJsonSafely } from "@/utils/utils";

const ScheduleDay = ({ selectedDate, date, view, activeStartDate, isDirty, setIsDirty, selectedTemplate }) => {
  const { spaceData, dispatch } = useSpaceContext();
  // const showOptions = selectedDate.getDate() == date.getDate();
  const [showOptions, setShowOptions] = useState(false);
  const [editPopup, setEditPopup] = useState(false);
  const showEditPopup = useDelayUnmount(editPopup, 300);
  const dayFormatted = moment(date).format("MM/DD/YY");

  // get slots from context or template
  let slots = Array.isArray(spaceData?.customSlots[dayFormatted])
    ? spaceData?.customSlots[dayFormatted]
    : selectedTemplate[daysMapping[date.getDay()]] == 1 && Array.isArray(parseJsonSafely(selectedTemplate.slots))
    ? parseJsonSafely(selectedTemplate.slots)
    : [];

  let isCustom = Array.isArray(spaceData?.customSlots[dayFormatted]);

  const { handleSubmit, register, control, getValues, setValue } = useForm({
    defaultValues: {
      custom_slot: slots.map((slot) => ({ start: formatAMPM(slot.start), end: formatAMPM(slot.end) })),
    },
  });
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control,
    name: "custom_slot",
  });

  const onSubmit = (data) => {
    console.log("editing", data);
    dispatch({
      type: "SET_DAY_SLOT",
      payload: {
        day: dayFormatted,
        slots: data.custom_slot.map((time) => ({ 
          start: new Date(`${dayFormatted} ${time.start}`).toISOString(), 
          end: new Date(`${dayFormatted} ${time.end}`).toISOString() })),
      },
    });
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

  useEffect(() => {
    setShowOptions(false);
  }, [selectedDate]);

  return (
    <div className={`${showOptions ? "" : ""} ${date.getDay() == 0 ? "" : "border-r-0"} schedule-day relative min-h-[180px] border border-t-0`}>
      <div className="flex justify-between border-b py-2 px-[14px]">
        <h5 className="font-semibold">{date.getDate()}</h5>
        {isCustom ? <CustomizedIcon /> : <RecurringIcon />}
      </div>
      <div className="flex flex-col items-start gap-3 px-[8px] py-4">
        {slots.slice(0, 3).map((sl, idx) => (
          <p key={idx}>{formatAMPM(sl.start) + " - " + formatAMPM(sl.end)}</p>
        ))}
        {slots.length > 3 && <span className="font-semibold"> + {slots.length - 3} More</span>}
      </div>
      {dayFormatted == moment(selectedDate).format("MM/DD/YY") && (
        <button
          className="options-btn absolute bottom-4 flex w-full justify-end border-2 border-red-400 p-2"
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
          className={`absolute top-1/2 ${
            date.getDay() == 0 ? "-left-1/2" : "left-1/2"
          }  border[#EAECF0] schedule-options z-10 flex min-w-[223px] flex-col whitespace-nowrap rounded-md border bg-white`}
        >
          <button
            className="flex w-full gap-[15px] p-3 hover:bg-gray-200"
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
              className="flex w-full gap-[15px] p-3 hover:bg-gray-200"
              onClick={resetToTemplate}
            >
              <ResetIcon />
              <span>Reset to {selectedTemplate.template_name}</span>
            </button>
          )}

          <button
            className="flex w-full gap-[15px] p-3 hover:bg-gray-200"
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
          className={`${editPopup ? "pop-in" : "pop-out"} w-[410px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-[18px] flex h-[40px] items-center justify-between">
            <h3 className="text-2xl font-semibold">Edit Day</h3>
            <button
              type="button"
              onClick={() => setEditPopup(false)}
              className="rounded-full border py-3 px-3 text-2xl font-normal duration-300 hover:bg-gray-200 active:bg-gray-300"
            >
              &#x2715;
            </button>
          </div>
          <div className="">
            <div className="tiny-scroll max-h-[400px] min-h-[200px] overflow-y-auto">
              {fields.map((field, index) => (
                <div
                  className="mb-[32px] flex gap-6"
                  key={field.id}
                >
                  <div className="flex flex-grow justify-between gap-2">
                    <select
                      className="tiny-scroll flex-grow border bg-white p-2 px-2 focus:outline-none"
                      {...register(`custom_slot.${index}.start`)}
                    >
                      {hourlySlots.map((time) => (
                        <option key={time}>{time}</option>
                      ))}
                    </select>
                    <select
                      className="tiny-scroll flex-grow border bg-white p-2 px-2 focus:outline-none"
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
              className="mb-[32px] text-sm font-semibold text-[#1570EF]"
              onClick={() => append({ start: "05:00 am", end: "07:00 am" })}
            >
              + Add another time slot
            </button>
          </div>
          <br />
          <button
            type="submit"
            className="login-btn-gradient mt-4 w-full rounded py-2 tracking-wide text-white  outline-none focus:outline-none"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScheduleDay;
