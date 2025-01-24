import { AuthContext, tokenExpireError } from "@/authContext";
import { LoadingButton } from "@/components/frontend";
import { GlobalContext, showToast } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useContext, useState } from "react";

export default function SuggestResendVerificationModal({ modalOpen, closeModal, email }) {
  const [loading, setLoading] = useState(false);
  const { dispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [ctrl] = useState(new AbortController());

  async function sendEmailVerification() {
    setLoading(true);
    const sdk = new MkdSDK();
    try {
      await sdk.callRawAPI("/v2/api/custom/ergo/resend-verification-email", { email }, "POST", ctrl.signal);
      showToast(globalDispatch, "Email sent, Please check your inbox", 8000);
      closeModal();
    } catch (err) {
      if (err.name == "AbortError") {
        setLoading(false);
        return;
      }
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Resend verification email?
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Your email address is not verified, would you like us to resend verification email to <b>{email}</b>
                  </p>
                </div>

                <div className="mt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none"
                    onClick={() => {
                      console.log("aborting");
                      ctrl.abort();
                      closeModal();
                    }}
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    type="button"
                    loading={loading}
                    onClick={sendEmailVerification}
                    className={`login-btn-gradient inline-flex justify-center rounded-md px-4 text-sm font-medium text-white ${loading ? "py-1" : "py-2"}`}
                  >
                    Yes, resend
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
