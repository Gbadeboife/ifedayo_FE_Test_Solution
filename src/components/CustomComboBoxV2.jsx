import { Combobox, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";
import { useController } from "react-hook-form";

export default function CustomComboBoxV2({ control, name, setValue, className, valueField, labelField, getItems, ...restProps }) {
  const { field, fieldState, formState } = useController({ control, name });
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState({});

  useEffect(() => {
    getItems("", setItems, field.value);
  }, [field.value]);

  useEffect(() => {
    if (selected[labelField]) {
      setQuery(selected[labelField]);
    }
  }, [selected[valueField]]);

  useEffect(() => {
    setSelected(items.find((item) => item[valueField] == field.value) ?? {});
  }, [field.value, items.length]);

  return (
    <Combobox
      as={"div"}
      className={`${className ?? ""} ${fieldState.error ? "border-red-500" : ""} normal-case`}
      value={field.value}
      onChange={setValue}
    >
      <Combobox.Input
        {...restProps}
        className="w-full truncate border-0 text-black focus:outline-none"
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.trim() == "") {
            setValue("");
          }
          getItems(e.target.value, setItems, field.value);
        }}
        value={query}
        onBlur={field.onBlur}
        ref={field.ref}
        name={field.name}
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
            items.length > 0 ? "py-2 shadow-lg ring-1" : ""
          }`}
        >
          {items.map((item, idx) => (
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
