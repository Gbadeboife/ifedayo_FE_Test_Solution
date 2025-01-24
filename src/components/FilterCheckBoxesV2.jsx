import { Disclosure, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { useController } from "react-hook-form";
import StarIcon from "./frontend/icons/StarIcon";

export default function FilterCheckBoxesV2({ name, control, setValue, reset, title, labelField, valueField, options }) {
  const { field, fieldState, formState } = useController({ control, name });

  return (
    <div className="mb-[34px]">
      <Disclosure defaultOpen>
        <div className="mb-[12px] flex justify-between">
          <h4 className="flex w-full justify-between text-[16px] font-semibold lg:block">
            <span className="lg:mr-2 lg:border-r lg:pr-2">{title}</span>
            <button
              className="text-sm font-normal lowercase lg:text-xs"
              onClick={reset}
            >
              Clear
            </button>
          </h4>
          <Disclosure.Button className="hidden duration-200 ui-open:rotate-180 lg:inline">
            {" "}
            <svg
              width="14"
              height="8"
              viewBox="0 0 14 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 7L7 1L1 7"
                stroke="#475467"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Disclosure.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition-all ease duration-500"
          enterFrom="max-h-0"
          enterTo="max-h-[900px]"
          leave="transition-all ease duration-500"
          leaveFrom="max-h-[900px]"
          leaveTo="max-h-0"
        >
          <Disclosure.Panel className="overflow-hidden text-gray-500 duration-500">
            {options.map((op, idx) => (
              <div
                className="checkbox-container flex gap-2 items-center mb-[12px]"
                key={idx}
              >
                <input
                  type={`${name === "capacity" ? "radio" : "checkbox"}`}
                  id={op[valueField]}
                  value={op[valueField]}
                  className={`text-xl w-5 h-8 rounded ${name === "capacity" ? "accent-[#0D9895]" : ""}`}
                  name={name}
                  checked={ field.value.includes(op[valueField])}
                  onChange={() => {
                    if (name === "capacity") {
                      field.onChange(op[valueField]);
                    } else {
                      const exists = field.value.includes(op[valueField]);
                      if (exists) {
                        field.onChange(field.value.filter((item) => item !== op[valueField]));
                      } else {
                        field.onChange([...field.value, op[valueField]]);
                      }
                    }
                  }}
                  // onChange={() => {
                  //   // remove if in array else add
                  //   const exists =  field.value.includes(op[valueField]);
                  //   if (exists && op[name] !== "capacity") {
                  //     field.onChange(field.value.filter((item) => item != op[valueField]));
                  //     return;
                  //   }
                  //   field.onChange([...field.value, op[valueField]]);
                  // }}
                  onBlur={field.onBlur}
                />

                {name !== "capacity" ?
                <label htmlFor={op[valueField]}>
                  {op[labelField]}{" "}
                  {title == "Reviews"
                    ? Array(Number(op[valueField]))
                        .fill("")
                        .map((_, idx) => (
                          <span
                            className="ml-1"
                            key={idx}
                          >
                            <StarIcon />
                          </span>
                        ))
                    : null}
                </label>
                :
                <span >
                  {op[labelField]}{" "}
                </span>
                }
              </div>
            ))}
          </Disclosure.Panel>
        </Transition>
      </Disclosure>
    </div>
  );
}
