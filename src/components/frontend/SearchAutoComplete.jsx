import { Fragment, useContext, useEffect, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { GlobalContext } from "@/globalContext";

const SearchAutoComplete = ({ selected, setSelected, className, optionsClassName }) => {
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const filteredCategories =
    query === ""
      ? categories
      : categories
          .filter((cat) => cat.category.toLowerCase().replace(/\s+/g, "").includes(query.toLowerCase().replace(/\s+/g, "")))
          .sort((a, b) => {
            if (a.category.toLowerCase().indexOf(query.toLowerCase()) > b.category.toLowerCase().indexOf(query.toLowerCase())) {
              return 1;
            } else if (a.category.toLowerCase().indexOf(query.toLowerCase()) < b.category.toLowerCase().indexOf(query.toLowerCase())) {
              return -1;
            } else {
              if (a.category > b.category) return 1;
              else return -1;
            }
          });

  async function fetchCategories() {
    const where = [1];
    try {
      const result = await callCustomAPI("spaces", "get", { page: 1, limit: 1000 }, "");
      if (Array.isArray(result.list)) {
        setCategories(result.list);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className={`${className ?? ""}`}>
      <Combobox
        value={selected}
        onChange={setSelected}
      >
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden text-left focus:outline-none sm:text-sm">
            <Combobox.Input
              className="w-full py-1 border-none px-3 text-sm leading-5 text-gray-900 focus:outline-none bg-transparent"
              displayValue={(cat) => cat.category}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by category"
              value={query}
              autoComplete="off"
            />
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options
              className={`absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm tiny-scroll ${
                optionsClassName ?? ""
              }`}
            >
              {filteredCategories.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Other</div>
              ) : (
                filteredCategories
                  .filter((cat) => cat.category != "")
                  .map((cat) => (
                    <Combobox.Option
                      key={cat.id}
                      className={({ active }) => `relative cursor-default select-none py-3 px-4 ${active ? "bg-teal-600 text-white" : "text-gray-900"}`}
                      value={cat}
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{cat.category}</span>
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
  );
};

export default SearchAutoComplete;
