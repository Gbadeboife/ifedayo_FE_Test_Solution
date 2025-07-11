import { LoadingButton } from "@/components/frontend";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function TwoFaDialog({ isOpen, closeModal, isEnabled, onProceed, loading }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 flex items-center justify-center"></div>}
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {isEnabled ? "Turn Off 2-Step Verification?" : "Protect your account with 2-Step Verification"}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {!isEnabled
                        ? "Prevent hackers from accessing your account with an additional layer of security. When you sign in, 2-Step Verification helps make sure that your personal information stays private, safe and secure."
                        : "Turning off 2-Step Verification will remove the extra security on your account, and you’ll only use your password to sign in."}
                    </p>
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
                      className={`inline-flex justify-center rounded-md ${loading ? "py-1 px-6" : "py-2 px-4"} text-sm font-medium login-btn-gradient text-white`}
                      onClick={onProceed}
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
    </>
  );
}
