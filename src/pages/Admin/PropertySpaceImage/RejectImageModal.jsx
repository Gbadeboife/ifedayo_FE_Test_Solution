import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import { IMAGE_STATUS } from "@/utils/constants";
import MkdSDK from "@/utils/MkdSDK";
import { parseJsonSafely } from "@/utils/utils";
import { Dialog, Transition } from "@headlessui/react";
import { useContext, useState } from "react";
import { Fragment } from "react";

export default function RejectImageModal({ modalOpen, data, closeModal, onSuccess }) {
  const { dispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    setLoading(true);
    const sdk = new MkdSDK();
    e.preventDefault();
    const formData = new FormData(e.target);
    const reason = formData.get("reason");
    sdk.setTable("property_spaces_images");
    try {
      await sdk.callRestAPI({ id: data.id, is_approved: IMAGE_STATUS.NOT_APPROVED }, "PUT");

      if (parseJsonSafely(data.settings, {}).email_on_space_image_declined == true) {
        const tmpl = await sdk.getEmailTemplate("space-image-decline");
        const body = tmpl.html?.replace(new RegExp("{{{reason}}}", "g"), reason);

        await sdk.sendEmail(data.email, tmpl.subject, body);
        showToast(globalDispatch, "Email sent to user");
      } else {
        showToast(globalDispatch, "Successful");
      }

      onSuccess();
      e.target.reset();
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
    closeModal();
    setLoading(false);
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
                    className="text-lg font-medium leading-6 text-gray-900 mb-8"
                  >
                    Decline Reason
                  </Dialog.Title>
                  <textarea
                    name="reason"
                    cols="30"
                    rows="5"
                    className="w-full focus:outline-none border-2 p-2 resize-none text-sm text-gray-900"
                  ></textarea>
                  <div className="mt-4 flex gap-4 justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-black px-4 py-2 text-sm font-medium"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={loading}
                      type="submit"
                      className="bg-gradient-to-r from-[#33D4B7] to-[#0D9895] text-white inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium"
                    >
                      Reject
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
