import { LoadingButton } from "@/components/frontend";
import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { parseJsonSafely, sleep } from "@/utils/utils";
import { Dialog, Transition } from "@headlessui/react";
import { useState } from "react";
import { useContext } from "react";
import { Fragment } from "react";

export default function EnableEmailDialog({ isOpen, closeModal }) {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const isEnabled = parseJsonSafely(globalState.user.settings, {}).email_on_booking_declined == true;
  const [loading, setLoading] = useState(false);

  async function toggleEmailPreference() {
    setLoading(true);
    let newSettings;
    if (!isEnabled) {
      newSettings = {
        ...parseJsonSafely(globalState.user.settings, {}),
        email_on_space_image_declined: true,
        email_on_booking_declined: true,
        email_on_profile_photo_declined: true,
        email_on_new_chat_message: true,
        email_on_space_booked: true,
        email_on_booking_cancelled: true,
        email_on_booking_accepted: true,
      };
    } else {
      newSettings = {
        ...parseJsonSafely(globalState.user.settings, {}),
        email_on_space_image_declined: false,
        email_on_booking_declined: false,
        email_on_profile_photo_declined: false,
        email_on_new_chat_message: false,
        email_on_space_booked: false,
        email_on_booking_cancelled: false,
        email_on_booking_accepted: false,
      };
    }
    try {
      await callCustomAPI(
        "edit-self",
        "post",
        {
          profile: { settings: JSON.stringify(newSettings) },
        },
        "",
      );
      closeModal();
      await sleep(200);
      globalDispatch({ type: "SET_USER_DATA", payload: { ...globalState.user, settings: JSON.stringify(newSettings) } });
    } catch (err) {
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Operation Failed", message: err.message } });
    }
    setLoading(false);
  }

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
                    {isEnabled ? "Turn Off Email Notifications" : "Enable email notifications?"}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {!isEnabled ? "Enable email notifications on site activity such as booking when booking is declined by host" : "Disabling email notifications on site activity"}
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
                      onClick={toggleEmailPreference}
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
