import { GlobalContext } from "@/globalContext";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import React, { Fragment } from "react";
import { useContext } from "react";

export default function ErrorModal() {
  const { state, dispatch } = useContext(GlobalContext);

  if (!state.error) return null;

  return (
    <Transition
      appear
      show={state.error}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => dispatch({ type: "CLOSE_ERROR" })}
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
        <div className="fixed inset-0 z-10 bg-black bg-opacity-25" />
        </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-center align-middle z-1000 shadow-xl transition-all">
                  <div className="flex justify-end">
                    <button
                      onClick={() => dispatch({ type: "CLOSE_ERROR" })}
                      className="text-gray-500 duration-100 hover:text-black"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="mt-8 text-2xl"
                  >
                    {state.errorHeading}
                  </Dialog.Title>

                  <p className="tiny-scroll mt-4 max-h-[300px] overflow-y-auto text-wrap break-normal text-sm text-gray-500">{state.errorMsg}</p>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
      </Dialog>
    </Transition>
  );
}
