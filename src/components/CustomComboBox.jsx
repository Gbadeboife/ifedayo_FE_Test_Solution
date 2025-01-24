import { Combobox, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { useController } from "react-hook-form";

export default function CustomComboBox({ control, name, setValue, containerClassName, valueField, labelField, items, ...restProps }) {
  const { field, fieldState, formState } = useController({ control, name });

  const filteredItems =
    field.value === ""
      ? items
      : items
          .filter((item) => item[labelField].toLowerCase().replace(/\s+/g, "").includes(field.value.toLowerCase().replace(/\s+/g, "")))
          .sort((a, b) => {
            if (a[labelField].toLowerCase().indexOf(field.value.toLowerCase()) > b[labelField].toLowerCase().indexOf(field.value.toLowerCase())) {
              return 1;
            } else if (a[labelField].toLowerCase().indexOf(field.value.toLowerCase()) < b[labelField].toLowerCase().indexOf(field.value.toLowerCase())) {
              return -1;
            } else {
              if (a[labelField] > b[labelField]) return 1;
              else return -1;
            }
          });

  return (
    <Combobox
      as={"div"}
      className={`${containerClassName ?? ""}`}
      value={field.value}
      onChange={setValue}
    >
      <Combobox.Input
        {...restProps}
        {...field}
        autoComplete="off"
      />
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Combobox.Options
          className={`tiny-scroll absolute left-0 right-0 top-full z-50 mt-2 max-h-60 w-full origin-top cursor-pointer divide-y divide-gray-100 overflow-y-auto rounded-xl bg-white ring-black ring-opacity-5 focus:outline-none ${
            filteredItems.length > 0 ? "py-2 shadow-lg ring-1" : ""
          }`}
        >
          {filteredItems.map((item, idx) => (
            <Combobox.Option
              className="flex w-full items-center truncate rounded-pill px-3 py-3 pr-5 text-sm ui-active:bg-gray-100 ui-active:text-black ui-not-active:text-gray-800"
              key={idx}
              value={item[valueField]}
            >
              {item[labelField]}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Transition>
    </Combobox>
  );
}
