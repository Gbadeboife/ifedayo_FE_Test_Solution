import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StarIcon from "./icons/StarIcon";

const FilterCheckBoxes = ({ name, options, searchField, query, optionFieldName, filterPopup }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(true);

  const uncheckAll = () => {
    searchParams.set(searchField, "");
    setSearchParams(searchParams);
  };

  const updateSearchQuery = (e) => {
    e.preventDefault();
    var prev = searchParams.get(searchField);
    prev = prev?.split(",") || [];
    if (!prev.includes(e.target.name)) {
      prev.push(e.target.name);
    } else {
      prev.splice(prev.indexOf(e.target.name), 1);
    }
    searchParams.set(searchField, prev.join(","));
    setSearchParams(searchParams);
  };

  useEffect(() => {
    if (filterPopup) {
      setOpen(true);
    }
  }, [filterPopup]);

  return (
    <div className="mb-[34px]">
      <div className="flex justify-between mb-[12px]">
        <h4 className="font-semibold text-[16px] lg:block flex justify-between w-full">
          <span className="lg:border-r lg:pr-2 lg:mr-2">{name}</span>
          <button
            className="lg:text-xs text-sm font-normal lowercase"
            onClick={uncheckAll}
          >
            Clear
          </button>
        </h4>
        <button
          className={`${open ? "" : "rotate-180"} duration-200 lg:inline hidden`}
          onClick={() => setOpen((prev) => !prev)}
        >
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
        </button>
      </div>
      <div className={`text-gray-500 text-[16px] duration-500 overflow-hidden ${open ? `pointer-events-auto max-h-[300px]` : "max-h-0 pointer-events-none"}`}>
        {options.map((op) => (
          <div
            className="checkbox-container mb-[12px]"
            key={op.id}
          >
            <input
              type="checkbox"
              id={op[optionFieldName] ?? op.name}
              onClick={updateSearchQuery}
              name={op[optionFieldName] ?? op.name}
              checked={Array.isArray(query[searchField]) ? query[searchField]?.includes(op[optionFieldName] ?? op.name) : false}
              onChange={() => {}}
            />
            <label htmlFor={op[optionFieldName] ?? op.name}>{op[optionFieldName] ?? op.name} {name == "Reviews" ? Array(Number(op.name)).fill("").map(() => <span className="ml-1 mb-1"><StarIcon /></span>) : null}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterCheckBoxes;
