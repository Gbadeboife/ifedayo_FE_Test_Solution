import { formatDate, isSameDay } from "@/utils/date-time-utils";
import { Popover, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";
import { Calendar } from "react-calendar";
import CalendarIcon from "./icons/CalendarIcon";
import NextIcon from "./icons/NextIcon";
import PrevIcon from "./icons/PrevIcon";
import { useController } from "react-hook-form";

const DatePicker = ({ initialDate, searchDate, control, setSearchDate, className, placeHolder, min, max, onChange, onReset, labelClassName, xClassName, panelClassName, hideIcon }) => {
  let isInitial = isSameDay(searchDate, initialDate);
  const { field, fieldState } = useController({ control, name });
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (!isNaN(new Date(field.value))) setDate(new Date(field.value));
  }, [field.value]);
  return (
    <div className={`w-full ${className ?? ""}`}>
      <Popover className="lg:relative">
        {({ open }) => (
          <>
            <Popover.Button className={`${open ? "" : "text-opacity-90"} flex justify-between w-full`}>
              <div className={`flex gap-2 ${labelClassName ?? ""}`}>
                {/* {!hideIcon ? <CalendarIcon /> : null} */}
                {isInitial ? (
                  <CalendarIcon />
                ) : (
                  <button
                    className={`self-end ${xClassName ?? ""}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchDate(initialDate);
                      if (onReset) {
                        onReset();
                      }
                    }}
                  >
                    &#x2715;
                  </button>
                )}
                <span className={`${isInitial ? "text-gray-400" : ""}`}>{!isInitial ? formatDate(searchDate) : placeHolder ?? "Select date"}</span>
              </div>
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
              className="relativ"
            >
              <Popover.Panel className={`absolute left-1/2  z-10 mt-3 -translate-x-1/2 transform px-4 sm:px-0 ${panelClassName ?? ""}`}>
                <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                  <Calendar
                    onChange={(v) => {
                      setSearchDate(v);

                      if (onChange) {
                        onChange(v);
                      }
                    }}
                    value={date}
                    className={`calendar date-picker`}
                    defaultValue={initialDate}
                    nextLabel={<NextIcon />}
                    prevLabel={<PrevIcon />}
                    next2Label={
                      <div
                        className="w-full h-full cursor-default"
                        onClick={(e) => e.stopPropagation()}
                      ></div>
                    }
                    prev2Label={
                      <div
                        className="w-full h-full cursor-default"
                        onClick={(e) => e.stopPropagation()}
                      ></div>
                    }
                    minDate={min}
                    maxDate={max}
                    maxDetail="month"
                  />
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
};

export default DatePicker;
