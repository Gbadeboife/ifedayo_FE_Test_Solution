import React from 'react'
import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { Dialog, Transition } from "@headlessui/react";
import { useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import { Fragment } from "react";
import MkdSDK from "@/utils/MkdSDK";

const PrivacyAndPolicyModal = ({ isOpen, closeModal }) => {
  const [privacy, setPrivacy] = useState("");
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function fetchPrivacyPolicy() {
    globalDispatch({ type: "START_LOADING" });
    const sdk = new MkdSDK();
    sdk.setTable("cms");
    try {
      const result = await callCustomAPI("cms", "post", { payload: { content_key: "privacy_policy" }, limit: 1000, page: 1 }, "PAGINATE");

      if (Array.isArray(result.list) && result.list.length > 0) {
        setPrivacy(result.list.find((stg) => stg.content_key == "privacy_policy")?.content_value);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Cannot get Privacy policy",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  return (
    <>
    <div className={`${isOpen ? "flex" : "hidden"} fixed inset-0 items-center justify-center`}></div>

    <Transition
      appear
      show={isOpen}
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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  {" "}
                  {" "}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="py-2 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full flex justify-end"
                  >
                    &#x2715;
                  </button>
                </Dialog.Title>
                <div className="mt-2">
                  <article
                    className="sun-editor-editable text-sm max-h-[600px] overflow-y-auto my-8"
                    dangerouslySetInnerHTML={{ __html: privacy }}
                  ></article>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  </>
  )
}

export default PrivacyAndPolicyModal