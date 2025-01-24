import { AuthContext } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { useTour } from "@reactour/tour";

export default function CustomerGettingStartedTour() {
  const navigate = useNavigate();
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  const [modalOpen, setModalOpen] = useState(true);
  const [gettingStarted, setGettingStarted] = useState();
  const { pathname } = useLocation();
  const sdk = new MkdSDK();

  const { setIsOpen } = useTour()

  async function markAsNotFirstTimeUser() {
    try {
      await sdk.callRawAPI("/v2/api/custom/ergo/edit-self", { profile: { getting_started: 1 } }, "POST");
      globalDispatch({
        type: "SET_USER_DATA",
        payload: {
          ...globalState.user,
          getting_started: 1,
        },
      });
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      console.log("err", err);
    }
  }

  if (!globalState.user.id) return null;

  const fetchUser = async () => {
    const result = await sdk.callRawAPI("/rest/profile/GETALL", {
      "payload": {
        "user_id": Number(globalState.user.id)
      },
      "selectStr": "*"
    },
      "POST");
    setGettingStarted(result.list[0]?.getting_started)
  }

  fetchUser()


  return (
    <>
      <Transition
        appear
        show={modalOpen && gettingStarted == 0}
        as={Fragment}
      >
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setModalOpen(false)}
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
                    First time login?
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Would you like a tour of the site?</p>
                  </div>

                  <div className="mt-4 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none"
                      onClick={() => {
                        setModalOpen(false);
                        markAsNotFirstTimeUser();
                      }}
                    >
                      No thanks
                    </button>
                    <button
                      type="button"
                      className={`login-btn-gradient inline-flex justify-center rounded-md py-2 px-4 text-sm font-medium text-white`}
                      onClick={() => {
                        setModalOpen(false);
                        setIsOpen(true)
                        globalDispatch({ type: "START_TOUR" });
                      }}
                    >
                      Yes please
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
