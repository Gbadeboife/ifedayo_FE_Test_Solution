import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { useController } from "react-hook-form";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";

export default function CustomSelectV2({ control, name, containerClassName, items, labelField, valueField, placeholder, shouldUnregister, ...restProps }) {
  const { field, fieldState } = useController({ control, name, shouldUnregister: shouldUnregister ?? true });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selected = items.find((item) => item[valueField] === (typeof field.value !== "number" ? field.value : +field.value));
  const defaultImage = items.find((item) => item["type"] === "1");

  return (
    <div className={`relative rounded-md focus:outline-none active:outline-none ${containerClassName}`}>
      <Listbox
        as={"fragment"}
        value={field.value}
        onChange={field.onChange}
      >
        <Listbox.Button
          className={`flex h-full w-full items-center justify-between ${field.value === "" ? "text-gray-500" : ""} ${restProps.className ?? ""} ${dropdownOpen ? restProps.openClassName ?? "" : ""}`}
        >
          <span className="block truncate">{selected ? selected[labelField] : defaultImage === undefined ? placeholder : defaultImage["name"]}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
          afterEnter={field.onBlur}
          beforeEnter={() => setDropdownOpen(true)}
          afterLeave={() => setDropdownOpen(false)}
        >
          <Listbox.Options
              className={`absolute z-50 mt-1 w-full max-h-60 md:max-w-lg overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm`}
          >
            {items.map((item, idx) => (
              <Listbox.Option
                key={idx}
                className={`relative cursor-pointer select-none py-2 pr-4 pl-4 ui-active:bg-amber-100 ui-active:text-amber-900 ui-not-active:text-gray-900`}
                value={item[valueField]}
              >
                {item[labelField]}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  );
}
