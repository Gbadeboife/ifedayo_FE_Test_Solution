import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useSpaceContext } from "./spaceContext";

export default function EditDescriptionModal({ modalOpen, closeModal }) {
  const { spaceData, dispatch } = useSpaceContext();

  async function onSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const description = formData.get("description");
    dispatch({ type: "SET_DESCRIPTION", payload: description });
    closeModal();
  }

  return (
    <>
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
                <Dialog.Panel
                  as="form"
                  className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                  onSubmit={onSubmit}
                >
                   <Dialog.Title
                    as="h3"
                    className="text-lg mb-8 font-medium leading-6 text-gray-900 flex w-full justify-between items-center"
                  >
                    {" "}
                    {" "}
                    <span>Description</span>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="py-2 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full flex justify-end"
                    >
                      &#x2715;
                    </button>
                  </Dialog.Title> 
                  <textarea
                    name="description"
                    cols="30"
                    rows="5"
                    className="w-full resize-none border-2 p-2 text-sm text-gray-900 focus:outline-none"
                    defaultValue={spaceData.description}
                  ></textarea>
                  <div className="mt-4 flex justify-end gap-4">
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-4 py-2 text-sm font-medium text-white"
                    >
                      Save
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
