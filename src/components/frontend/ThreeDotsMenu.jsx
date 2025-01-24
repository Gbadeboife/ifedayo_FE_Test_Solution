import { Menu, Transition } from "@headlessui/react";
import React from "react";
import { Fragment } from "react";
import Icon from "../Icons";

const ThreeDotsMenu = ({ items, direction, disabled, menuClassName, hidden }) => {
  const filteredItems = items.filter((item) => !item.notShow);
  return (
    <Menu
      as="div"
      className={`relative max-w-[150px] ${hidden ? "hidden" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="">
        <Menu.Button
          disabled={disabled}
          className={"inline-flex justify-center px-1 py-3 text-sm font-medium text-gray-700 " + (direction == "vert" ? "rotate-90" : "")}
        >
          <Icon type="dots" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute right-0 z-10 mt-0 w-40 origin-top-right rounded-md bg-white ${filteredItems.length ? "shadow-lg ring-1" : ""}  ring-black ring-opacity-5 focus:outline-none ${
            menuClassName ?? ""
          }`}
        >
          <div className={filteredItems.length > 0 ? "py-1" : ""}>
            {filteredItems.map((item, idx) => (
              <Menu.Item key={idx}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    className={`${active ? "bg-gray-100 text-gray-900" : "text-gray-700"} w-full text-center inline-flex gap-2 items-center px-4 py-2 text-sm whitespace-nowrap`}
                  >
                    {item?.icon}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ThreeDotsMenu;
