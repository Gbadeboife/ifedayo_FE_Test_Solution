import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import NextIcon from "./icons/NextIcon";
import { useEffect } from "react";

export default function CustomSelect({
  options,
  accessor,
  name,
  register,
  setValue,
  formMode,
  valueAccessor,
  defaultValue,
  className,
  optionsClassName,
  defaultOptionClassName,
  onChange,
  initialEditValue,
  buttonClassName,
  listOptionClassName,
  noSelectedHighlight,
  hideIcon,
}) {
  const [selected, setSelected] = useState(defaultValue ?? options[0]);

  useEffect(() => {
    if (formMode) {
      if (selected == defaultValue) {
        setValue(name, "");
      } else {
        setValue(name, valueAccessor ? selected[valueAccessor] : selected);
      }
    }
  }, [selected]);

  useEffect(() => {
    if (formMode && defaultValue) {
      setValue(name, "");
    }
  }, []);

  useEffect(() => {
    if (initialEditValue) {
      setSelected(initialEditValue);
    }
  }, [JSON.stringify(initialEditValue)]);

  return (
    <div className={`border p-2 rounded-md focus:outline-none active:outline-none ${className}`}>
      <Listbox
        value={selected}
        onChange={(v) => {
          setSelected(v);
          if (onChange) {
            onChange(valueAccessor ? v[valueAccessor] : v);
          }
        }}
      >
        {formMode && (
          <input
            {...register(name)}
            type="hidden"
          />
        )}

        <div className="relative mt-1">
          <Listbox.Button
            className={`flex items-center justify-between w-full ${(accessor && JSON.stringify(selected) == JSON.stringify(defaultValue)) || accessor == defaultValue ? defaultOptionClassName : ""}`}
          >
            <span className={`block truncate ${buttonClassName ?? ""}`}>{accessor ? selected[accessor] : selected}</span>
            <span className={`${hideIcon ? "hidden" : "inline"} pointer-events-none flex items-center pr-2`}>
              <NextIcon />
            </span>{" "}
          </Listbox.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Listbox.Options
              className={`absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${optionsClassName} z-50 tiny-scroll`}
            >
              {defaultValue && (
                <Listbox.Option
                  className={({ active }) => `relative cursor-default select-none py-2 pr-4 ${active ? "bg-amber-100 text-amber-900" : "text-gray-900"} ${listOptionClassName ?? "pl-10"}`}
                  value={defaultValue}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{accessor ? defaultValue[accessor] : defaultValue}</span>
                      {selected && !noSelectedHighlight ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">&#10003;</span> : null}
                    </>
                  )}
                </Listbox.Option>
              )}
              {options.map((option, idx) => (
                <Listbox.Option
                  key={idx}
                  className={({ active }) => `relative cursor-default select-none py-2 ${listOptionClassName ?? "pl-10"} pr-4 ${active ? "bg-amber-100 text-amber-900" : "text-gray-900"}`}
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{accessor ? option[accessor] : option}</span>
                      {selected && !noSelectedHighlight ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">&#10003;</span> : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
