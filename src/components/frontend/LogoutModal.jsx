import { AuthContext } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router";
import LoadingButton from "./LoadingButton";

export default function LogoutModal({ modalOpen, closeModal }) {
  const { dispatch: authDispatch } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function logout() {
    setLoading(true);
    const sdk = new MkdSDK();
    try {
      await sdk.logout();
      authDispatch({ type: "LOGOUT" });
      navigate("/");
      closeModal();
    } catch (err) {
      // still logout if the token is already expired
      if (err.message == "TOKEN_EXPIRED") {
        authDispatch({ type: "LOGOUT" });
        navigate("/");
        closeModal();
      }
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
                  Are you sure
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Are you sure you want to sign out?</p>
                </div>

                <div className="mt-4 flex justify-end gap-4">
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
                    className={`inline-flex justify-center rounded-md ${loading ? "py-1 px-6" : "py-2 px-4"} login-btn-gradient text-sm font-medium text-white`}
                    onClick={logout}
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
