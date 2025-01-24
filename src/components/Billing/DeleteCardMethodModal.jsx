import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useContext, useState } from "react";
import { LoadingButton } from "../frontend";

export default function DeleteCardMethodModal({ modalOpen, closeModal, onSuccess, card }) {
  const [loading, setLoading] = useState(false);
  const { dispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const sdk = new MkdSDK();
  const [ctrl] = useState(new AbortController());

  async function onSubmit(e) {
    setLoading(true);
    e.preventDefault();
    try {
      await sdk.deleteCustomerStripeCard(card.id, ctrl.signal);
      closeModal();
      onSuccess();
    } catch (err) {
      if (err.name == "AbortError") {
        setLoading(false);
        return;
      }
      tokenExpireError(dispatch, err.message);
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Card Deletion Failed", message: err.message } });
    }
    setLoading(false);
  }

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
              <Dialog.Panel
                as="form"
                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                onSubmit={onSubmit}
              >
                <div className="mb-[18px] flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="mb-[8px] text-2xl font-semibold"
                  >
                    Delete Payment Method
                  </Dialog.Title>
                  <button
                    onClick={closeModal}
                    className="rounded-full border p-1 px-3 text-2xl font-normal duration-100 hover:bg-gray-200 active:bg-gray-300"
                  >
                    &#x2715;
                  </button>
                </div>
                <p>You are about to remove card ending with {card.last4}</p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="mt-4 flex-grow rounded border-2 border-[#98A2B3] py-2 tracking-wide outline-none focus:outline-none"
                    onClick={() => {
                      ctrl.abort();
                      closeModal();
                    }}
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    loading={loading}
                    type="submit"
                    className={`mt-4 flex-grow rounded bg-[#D92D20] ${loading ? "py-1 px-4" : "py-2"} tracking-wide text-white outline-none focus:outline-none`}
                  >
                    Yes, remove
                  </LoadingButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
