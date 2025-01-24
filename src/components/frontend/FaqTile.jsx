import { Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";

const FaqTile = ({ data }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`mb-8 overflow-hidden`}>
      <div
        className={`mb-5 bg-[#F0F5F3] p-2 px-5 cursor-pointer rounded-xl overflow-hidden`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex justify-between items-center">
          <h1>{data.question}</h1>
          <button className="text-4xl">{!open ? <span>&#43;</span> : <span>&#8722;</span>} </button>
        </div>
      </div>
      <Transition
        as={Fragment}
        show={open}
        enter="transition-all ease duration-500 overflow-hidden"
        enterFrom="max-h-0"
        enterTo="max-h-[400px]"
        leave="transition-all ease duration-500 overflow-hidden"
        leaveFrom="max-h-[400px]"
        leaveTo="max-h-0"
      >
        <p
          className={`sun-editor-editable pl-4 z-50`}
          dangerouslySetInnerHTML={{ __html: data.answer }}
        ></p>
      </Transition>
    </div>
  );
};

export default FaqTile;
