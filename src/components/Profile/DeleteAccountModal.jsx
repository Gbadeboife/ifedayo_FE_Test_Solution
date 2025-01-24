import { AuthContext } from "@/authContext";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router";
import { LoadingButton } from "@/components/frontend";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { GlobalContext } from "@/globalContext";

export default function DeleteAccountModal({ modalOpen, closeModal }) {
  const { dispatch: authDispatch, state: authState } = useContext(AuthContext);
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function requestAccountDelete() {
    setLoading(true);
    try {
      await callCustomAPI("confirm-delete-email", "post", { user_id: globalState.user.id, email: globalState.user.email, role: authState.role }, "");
      navigate("/account/delete/check");
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
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
                  Are you sure you want to delete your account?
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">You will receive an email to confirm this action</p>
                </div>

                <div className="mt-4 flex gap-4 justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    loading={loading}
                    type="button"
                    className={`inline-flex justify-center rounded-md ${loading ? "py-1 px-6" : "py-2 px-4"} text-sm font-medium bg-red-500 text-white`}
                    onClick={requestAccountDelete}
                  >
                    Proceed
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
