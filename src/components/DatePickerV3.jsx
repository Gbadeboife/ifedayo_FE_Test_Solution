import { formatDate } from "@/utils/date-time-utils";
import { Popover, Transition } from "@headlessui/react";
import React, { Fragment, useEffect } from "react";
import { Calendar } from "react-calendar";
import { useController } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import CalendarIcon from "./frontend/icons/CalendarIcon";
import NextIcon from "./frontend/icons/NextIcon";
import PrevIcon from "./frontend/icons/PrevIcon";

export default function DatePickerV3({ control, name, placeholder, labelClassName, reset, min }) {
  const { field, fieldState, formState } = useController({ control, name });
  const [searchParams] = useSearchParams();

  return (
    <div className={`w-full`}>
      <Popover className="lg:relative">
        <Popover.Button className={`flex w-full justify-between focus:outline-none ui-open:text-opacity-90`}>
          <div className={`flex gap-2 ${labelClassName ?? ""}`}>
            {!fieldState.isDirty ? (
              <CalendarIcon />
            ) : (
              <span
                className={`self-end`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                  searchParams.delete(name);
                }}
              >
                &#x2715;
              </span>
            )}
            <span className={`${!fieldState.isDirty ? "text-gray-400" : ""}`}>{fieldState.isDirty || searchParams.get(name) ? formatDate(field.value) : placeholder}</span>
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
          afterEnter={field.onBlur}
        >
          <Popover.Panel className={`absolute left-1/2 z-10 mt-3 -translate-x-1/2 transform px-4 pb-12 sm:px-0`}>
            {({ close }) => (
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <Calendar
                  onChange={(val) => {
                    field.onChange(val);
                    close();
                  }}
                  value={field.value}
                  className={`calendar date-picker`}
                  nextLabel={<NextIcon />}
                  prevLabel={<PrevIcon />}
                  next2Label={
                    <div
                      className="h-full w-full cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    ></div>
                  }
                  prev2Label={
                    <div
                      className="h-full w-full cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    ></div>
                  }
                  maxDetail="month"
                  minDate={min}
                />
              </div>
            )}
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  );
}
