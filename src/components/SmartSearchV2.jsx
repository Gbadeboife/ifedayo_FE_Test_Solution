import { Combobox, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";

export default function SmartSearchV2({ data, fieldToDisplay, setSelected, selected, placeholder }) {
  const [query, setQuery] = useState("");
  const filteredData =
    query === ""
      ? data
      : data
          .filter((cat) => cat[fieldToDisplay].toLowerCase().replace(/\s+/g, "").includes(query.toLowerCase().replace(/\s+/g, "")))
          .sort((a, b) => {
            if (a[fieldToDisplay].toLowerCase().indexOf(query.toLowerCase()) > b[fieldToDisplay].toLowerCase().indexOf(query.toLowerCase())) {
              return 1;
            } else if (a[fieldToDisplay].toLowerCase().indexOf(query.toLowerCase()) < b[fieldToDisplay].toLowerCase().indexOf(query.toLowerCase())) {
              return -1;
            } else {
              if (a[fieldToDisplay] > b[fieldToDisplay]) return 1;
              else return -1;
            }
          });

  return (
    <>
      {" "}
      <div className="border w-full p-2">
        <Combobox
          value={selected}
          onChange={setSelected}
        >
          <div className="relative">
            <div className="relative w-full cursor-default overflow-hidden text-left focus:outline-none sm:text-sm">
              <Combobox.Input
                className="w-full border-none focus:outline-none"
                displayValue={(cat) => cat[fieldToDisplay]}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder ?? "Type to search.."}
              />
            </div>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery("")}
            >
              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm review-scroll custom-calendar-scroll">
                {filteredData.length === 0 && query !== "" ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Other</div>
                ) : (
                  filteredData
                    .filter((cat) => cat[fieldToDisplay] != "")
                    .map((cat) => (
                      <Combobox.Option
                        key={cat.id}
                        className={({ active }) => `relative cursor-default select-none py-2 px-4 ${active ? "bg-teal-600 text-white" : "text-gray-900"}`}
                        value={cat}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{cat[fieldToDisplay]}</span>
                          </>
                        )}
                      </Combobox.Option>
                    ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
      </div>
    </>
  );
}
