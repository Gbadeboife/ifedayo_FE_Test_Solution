import NoteIcon from "@/components/frontend/icons/NoteIcon";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";

export default function SelectTemplatesModal({ modalOpen, closeModal, templates, clearAll, selectedTemplate, setSelectedTemplate }) {
  return (
    <Transition
      appear
      show={modalOpen}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-10"
        onClose={closeModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="mb-[18px] flex items-center justify-between">
                  <Dialog.Title className="text-2xl font-semibold">Select Schedule template</Dialog.Title>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-circle border p-1 px-3 text-2xl font-normal duration-300 hover:bg-gray-200"
                  >
                    &#x2715;
                  </button>
                </div>
                <div className="tiny-scroll flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
                  {templates.map((tmp) => (
                    <button
                      key={tmp.id}
                      onClick={() => {
                        clearAll();
                        setSelectedTemplate(tmp);
                        closeModal();
                      }}
                      className={`${selectedTemplate.id == tmp.id ? "border-blue-200" : ""} w-full rounded-lg border-2 p-3`}
                    >
                      {tmp.template_name}
                    </button>
                  ))}
                  {templates.length == 0 && (
                    <p className="flex h-32 items-center justify-center">
                      <NoteIcon />
                      <span className="ml-2"></span> No templates yet
                    </p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
