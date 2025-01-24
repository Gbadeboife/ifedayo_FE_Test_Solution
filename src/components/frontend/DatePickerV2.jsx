import { Popover, Transition } from "@headlessui/react";
import moment from "moment";
import React, { Fragment, useState } from "react";
import { useEffect } from "react";
import { Calendar } from "react-calendar";
import { useController } from "react-hook-form";
import CalendarIcon from "./icons/CalendarIcon";
import NextIcon from "./icons/NextIcon";
import PrevIcon from "./icons/PrevIcon";

export default function DatePickerV2({ control, name, min, type, max, setValue, classNameCustomized }) {
  const { field, fieldState } = useController({ control, name });
  const [date, setDate] = useState(new Date());
  const [showCalender, setShowCalender] = useState(false);

  useEffect(() => {
    if (!isNaN(new Date(field.value))) setDate(new Date(field.value));
  }, [field.value]);

  return (
    <div className={`${classNameCustomized ? classNameCustomized : type ? "mb-0" : "mb-8 w-full relative"}`}>
      <div className="relative !min-h-[40px] gap-3 hover:cursor-pointer">
        <input
          type="date"
          max="9999-12-31"
          className={`${classNameCustomized ? "h-10" : "h-12"} text-left !min-h-[40px] w-full resize-non rounded-md border bg-transparent p-2 px-4 focus:outline-none active:outline-none`}
          autoComplete="off"
          {...field}
          disabled={false}
          placeholder="ceremony"
          style={{ textAlignLast: 'left' }}
        />
        <div className="flex items-center absolute -right-2 top-[7px]">
        <span>D.O.B</span>
        <button
          className={" h-[38px] bg-white px-3"}
          type="button"
          onClick={() => setShowCalender(!showCalender)}
        >
          <CalendarIcon />
        </button>
        </div>
      </div>
      {showCalender &&
        <div className="absolute z-50">
          <Calendar
            onChange={(v) => {
              setValue(moment(v).format("yyyy-MM-DD"));
              setShowCalender(false);
            }}
            value={date}
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
            minDate={min}
            maxDate={max}
            maxDetail="month"
          />
        </div>
      }

    </div>
  );
}
