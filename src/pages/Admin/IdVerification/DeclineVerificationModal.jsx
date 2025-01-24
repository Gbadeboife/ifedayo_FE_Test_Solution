import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import { useContext, useState } from "react";
import { Fragment } from "react";

export default function DeclineVerificationModal({ modalOpen, data, closeModal, onSuccess }) {
  const { dispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [loading, setLoading] = useState();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const sdk = new MkdSDK();
    const formData = new FormData(e.target);
    const reason = formData.get("reason");
    sdk.setTable("property_spaces_images");
    try {
      sdk.setTable("id_verification");
      await sdk.callRestAPI(
        {
          id: data.id,
          status: 2,
        },
        "PUT",
      );

      const tmpl = await sdk.getEmailTemplate("id-verification-declined");
      const body = tmpl.html?.replace(new RegExp("{{{reason}}}", "g"), reason).replace(new RegExp("{{{type}}}", "g"), data.type).replace(new RegExp("{{{first_name}}}", "g"), data.first_name);

      await sdk.sendEmail(data.email, tmpl.subject, body);
      showToast(globalDispatch, "Successful, email sent to user");

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
                    className="text-lg mb-8 font-medium leading-6 text-gray-900"
                  >
                    Decline Reason
                  </Dialog.Title>
                  <textarea
                    name="reason"
                    cols="30"
                    rows="5"
                    className="w-full resize-none border-2 p-2 text-sm text-gray-900 focus:outline-none"
                  ></textarea>
                  <div className="mt-4 flex justify-end gap-4">
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
                      className="inline-flex justify-center rounded-md bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-4 py-2 text-sm font-medium text-white"
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
