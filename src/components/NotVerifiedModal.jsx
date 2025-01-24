import { AuthContext } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router";

export default function NotVerifiedModal() {
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { state: authState } = useContext(AuthContext);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Transition
      appear
      show={globalState.notVerifiedModal}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => globalDispatch({ type: "CLOSE_NOT_VERIFIED_MODAL" })}
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
                  User not verified
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Please verify your account to proceed with booking</p>
                </div>

                <div className="mt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none"
                    onClick={() => globalDispatch({ type: "CLOSE_NOT_VERIFIED_MODAL" })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/account/verification?redirect_uri=${pathname}`);
                      globalDispatch({ type: "CLOSE_NOT_VERIFIED_MODAL" });
                    }}
                    className={`login-btn-gradient inline-flex justify-center rounded-md py-2 px-4 text-sm font-medium text-white`}
                  >
                    Get verified
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
