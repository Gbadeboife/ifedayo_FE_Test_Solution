import React, { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { debounce } from "@/utils/utils";

const SmartSearch = ({ selectedData, setSelectedData, data, field, field2, errorField, getData, setError, type, multiple = false }) => {
  const [query, setQuery] = useState("");

  return (
    <Combobox
      value={selectedData}
      onChange={(item) => {
        setSelectedData(item);
        setError(errorField, {
          type: "manual",
          message: null
        });
      }}
      disabled={type ? true : false}
      multiple={multiple}
    >
      <div className="relative mt-1">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left sm:text-sm">
          <Combobox.Input as="input"
            className="border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            displayValue={(item) =>
              !field2
                ? multiple
                  ? item.map((it) => it[field]).join(",")
                  : item[field]
                : item !== undefined && item[field] !== ""
                  ? multiple
                    ? item.map((it) => `${item[field]} - ${item[field2]}`)
                    : `${item[field]} - ${item[field2]}`
                  : ""
            }
            onChange={(event) => {
              setQuery(event.target.value);
              let searchValue = event.target.value;
              if (multiple) {
                let splitResult = searchValue.split(",");
                let index = splitResult.length > 1 ? splitResult.length - 1 : 0;
                searchValue = splitResult[index];
              }
              debounce(() => getData(1, 10, { [field]: searchValue.trim() }));
              if (event.target.value === "") {
                const emptyParam = { [field]: "" };
                if (field2) {
                  emptyParam[field2] = "";
                }
                setSelectedData(multiple ? [] : { ...emptyParam });
              }
            }}
          />
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute mt-1 z-50 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {data && data.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Nothing found.</div>
            ) : (
              data &&
              data.map((item) => (
                <Combobox.Option
                  disabled
                  key={item.id}
                  className={({ active }) => `relative normal-case cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-teal-600 text-white" : "text-gray-900"}`}
                  value={item}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{!field2 ? item[field] : `${item[field]} - ${item[field2]}`}</span>
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
};

export default SmartSearch;
