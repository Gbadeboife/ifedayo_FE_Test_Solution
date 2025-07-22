import { fullMonthsMapping, hourlySlots, monthsMapping, daysMapping } from "@/utils/date-time-utils";
import { formatScheduleDate, parseJsonSafely } from "@/utils/utils";
import moment from "moment";
import React, { useState } from "react";
import { Calendar } from "react-calendar";
import CalendarIcon from "./icons/CalendarIcon";
import NextIcon from "./icons/NextIcon";
import PrevIcon from "./icons/PrevIcon";

const DateTimePicker = ({ defaultDate, register, fieldNames, setValue, showCalendar, setShowCalendar, toDefault, fromDefault, bookedSlots, scheduleTemplate, defaultMessage }) => {
  const [selectedDate, setSelectedDate] = useState(defaultDate ?? new Date());
  const [from, setFrom] = useState(fromDefault ?? "");
  const [to, setTo] = useState(toDefault ?? "");

  const onApply = () => {
    // Validate times before applying
    if (from && to) {
      const fromMinutes = timeToMinutes(from);
      const toMinutes = timeToMinutes(to);
      if (toMinutes <= fromMinutes) {
        return; // Don't apply invalid time range
      }
    }
    setValue("from", from);
    setValue("to", to);
    setValue("selectedDate", selectedDate);
    setShowCalendar(false);
  };

  // Helper function to convert time string to minutes for comparison
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    
    // Handle format like "12:00 am", "01:00 pm"
    const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!match) return 0;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toLowerCase();
    
    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  // Helper function to validate time selection
  const validateTimeSelection = (newFrom, newTo) => {
    if (!newFrom || !newTo) return true;
    const fromMinutes = timeToMinutes(newFrom);
    const toMinutes = timeToMinutes(newTo);
    return toMinutes > fromMinutes;
  };

  // Helper function to check if a time slot conflicts with booked slots
  const isSlotBooked = (slotTime, bookedSlots) => {
    if (!bookedSlots || bookedSlots.length === 0) return false;
    
    const formattedDate = moment(selectedDate).format("MM/DD/YY");
    const slotDateTime = new Date(formattedDate + " " + slotTime);
    
    return bookedSlots.some(bookedSlot => {
      const bookedStart = new Date(bookedSlot.fromTime);
      const bookedEnd = new Date(bookedSlot.toTime);
      return slotDateTime >= bookedStart && slotDateTime < bookedEnd;
    });
  };

  return (
    <div
      className={showCalendar ? "popup-mobile z-50" : ""}
      onClick={() => setShowCalendar((prev) => !prev)}
    >
      {fieldNames.map((field, idx) => (
        <input
          key={idx}
          type="hidden"
          {...register(field)}
        />
      ))}

      <button
        type="button"
        className={`${showCalendar ? "" : "border-2"} md:border-2 p-2 w-full md:relative flex pr-16 gap-2 items-center`}
        onClick={(e) => {
          setShowCalendar((prev) => !prev);
          e.stopPropagation();
        }}
      >
        <div className={`md:inline ${showCalendar ? "hidden" : ""}`}>
          <CalendarIcon />
        </div>
        <span
          id="booking-time"
          className={showCalendar ? "hidden" : "inline whitespace-nowrap md:text-base text-sm"}
        >
          {from && to
            ? monthsMapping[selectedDate.getMonth()] + " " + selectedDate.getDate() + "/" + selectedDate.getFullYear() + " - " + from + " to " + to
            : defaultMessage ?? "Select date and time"}
        </span>
        {
          <div
            className={`${showCalendar ? "block" : "hidden"
              } absolute md:w-[unset] w-[80vw] bottom-[15px] top-[0%] md:-top-[22.5rem] 2xl:-top-[20rem] md:-left-10 lg:left-[-150px] left-0 md:right-[unset] right-0 text-center mx-auto shadow-lg bg-white border-2 text-sm md:max-h-[unset] min-h-[55vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-[16px]">
              <h3 className="text-xl font-semibold">Select date and time</h3>
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="p-1 px-3 text-2xl font-normal duration-100 border rounded-full hover:bg-gray-200 active:bg-gray-300"
              >
                &#x2715;
              </button>
            </div>
            <div className="flex flex-col md:flex-row">
              <div className="">
                <Calendar
                  onChange={(newDate) => {
                    setSelectedDate(newDate);
                    setFrom("");
                    setTo("");
                  }}
                  value={selectedDate}
                  className={`custom-calendar`}
                  nextLabel={<NextIcon />}
                  prevLabel={<PrevIcon />}
                  next2Label={<></>}
                  prev2Label={<></>}
                  tileDisabled={({ date }) => {
                    let customSlots = [];
                    try {
                      if (scheduleTemplate?.custom_slots && (Object.keys(scheduleTemplate?.custom_slots))?.length > 0) {
                        customSlots = JSON.parse(scheduleTemplate?.custom_slots || "[]");
                      }
                    } catch (e) {
                      console.error("Invalid JSON in custom_slots", e);
                    }
                    if (customSlots.length > 0 && customSlots[(formatScheduleDate(date)).toString()]?.length === 0) {
                      return true;
                    }
                    if (scheduleTemplate?.id && scheduleTemplate[daysMapping[date.getDay()]] != 1) {
                      return true;
                    }
                  }}
                  minDate={new Date()}
                  maxDetail="month"
                />
                <p className="text-left p-[16px] text-[#667085]">Pacific Time - US & Canada</p>
                <div className="md:flex hidden px-[16px] py-1 cursor-default text-left">
                  <p className="min-w-[150px]">From - {from}</p>
                  <p>Until - {to}</p>
                </div>
              </div>
              <div className="p-2">
                <p className="mb-4 font-semibold text-center">
                  <span className="capitalize">{daysMapping[selectedDate.getDay()]}</span> , {fullMonthsMapping[selectedDate.getMonth()]} {selectedDate.getDate()}
                </p>
                <div className="flex flex-col gap-[12px] custom-calendar-scroll review-scroll overflow-y-auto overflow-x-hidden md:max-h-[270px] max-h-[150px] md:px-6 px-3 text-[#667085]">
                  {hourlySlots.map((tm, idx) => {
                    var formattedDate = moment(selectedDate).format("MM/DD/YY");
                    var fromTime = new Date(formattedDate + " " + from);
                    var toTime = new Date(formattedDate + " " + to);
                    var slotTime = new Date(formattedDate + " " + tm);
                    var slotTimeOnly = new Date("01/01/2001" + " " + tm);
                    var json = scheduleTemplate.custom_slots ?? "[]";
                    var custom_slots_obj = parseJsonSafely(json, {});
                    var custom_slots = custom_slots_obj[formattedDate] ?? [];
                    custom_slots = custom_slots.map((slot) => ({ fromTime: new Date(slot.start), toTime: new Date(slot.end) }));
                    var template_slots = Array.isArray(scheduleTemplate.slots) ? scheduleTemplate.slots.map((slot) => ({ fromTime: new Date(slot.start), toTime: new Date(slot.end) })) : [];

                    return (
                      <button
                        type="button"
                        key={idx}
                        className={`${from == tm || to == tm ? "border-black border-2" : "border disabled:bg-[#F2F4F7] disabled:line-through border-[#EAECF0]"
                          }  md:w-[152px] w-full text-center py-[8px] ${from && to && fromTime <= slotTime && toTime >= slotTime ? "font-semibold between-slots" : ""}`}
                        onClick={(e) => {
                          if (from == tm) {
                            setFrom("");
                            setTo("");
                            return;
                          }
                          if (to == tm) {
                            setTo("");
                            return;
                          }
                          
                          if (from == "") {
                            setFrom(e.target.innerText);
                          } else {
                            // Validate before setting new "to" time
                            const newTo = e.target.innerText;
                            if (validateTimeSelection(from, newTo)) {
                              setTo(newTo);
                            }
                          }
                        }}
                        disabled={(() => {
                          // disabled slots that are not available in template only if a custom slot was not defined for the selectedDay
                          // if custom slots were defined for selectedDay then disable slots that are not included

                          // disable if time is < current time
                          if (slotTime < new Date()) return true;

                          // Fix for issue b: Disable slots that conflict with existing bookings
                          if (isSlotBooked(tm, bookedSlots)) return true;

                          // Fix for issue a: Disable "to" time slots that are before or equal to "from" time
                          if (from !== "" && to === "") {
                            const fromMinutes = timeToMinutes(from);
                            const slotMinutes = timeToMinutes(tm);
                            if (slotMinutes <= fromMinutes) return true;
                          }

                          if (custom_slots.length > 0) {
                            var shouldDisable = false;
                            for (let i = 0; i < custom_slots.length; i++) {
                              const slot = custom_slots[i];
                              if (slot.fromTime <= slotTime && slot.toTime >= slotTime) {
                                shouldDisable = false;
                                break;
                              } else {
                                shouldDisable = true;
                              }
                            }
                            if (shouldDisable) return true;
                          }
                          else {
                            var shouldDisable = false;
                            for (let i = 0; i < template_slots.length; i++) {
                              const slot = template_slots[i];
                              if (slot.fromTime <= slotTimeOnly && slot.toTime >= slotTimeOnly) {
                                shouldDisable = false;
                                break;
                              } else {
                                shouldDisable = true;
                              }
                            }
                            if (shouldDisable) return true;
                          }
                        })()}
                      >
                        {tm}
                      </button>
                    );
                  })}
                </div>
                <div className="px-6 mt-8">
                  <button
                    type="button"
                    className="login-btn-gradient w-[152px] text-center py-[8px] rounded-sm text-white"
                    disabled={from == "" || to == ""}
                    onClick={onApply}
                  >
                    Apply
                  </button>
                </div>
                <div className="flex px-1 py-1 mt-2 text-left cursor-default md:hidden">
                  <p className="min-w-[150px]">From - {from}</p>
                  <p>Until - {to}</p>
                </div>
              </div>
            </div>
          </div>
        }
      </button>
    </div>
  );
};

export default DateTimePicker;