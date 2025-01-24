import { LoadingButton } from "@/components/frontend";
import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { useState } from "react";
import { useContext } from "react";
import { useForm } from "react-hook-form";

export default function EditProfileModal({ modalOpen, closeModal }) {
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { handleSubmit, register } = useForm({ defaultValues: { first_name: globalState.user.first_name, last_name: globalState.user.last_name } });
  const [loading, setLoading] = useState(false);

  async function onSubmit(data) {
    console.log("submitting", data);
    setLoading(true);
    try {
      await callCustomAPI(
        "edit-self",
        "post",
        {
          user: data,
        },
        "",
      );
      closeModal();
      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: {
          heading: "Success",
          message: "Name change successful",
          btn: "Ok got it",
        },
      });
      globalDispatch({
        type: "SET_USER_DATA",
        payload: {
          ...globalState.user,
          first_name: data.first_name,
          last_name: data.last_name,
        },
      });
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
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="flex justify-between items-center mb-[18px]">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-semibold"
                    >
                      Edit Profile
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="p-1 border hover:bg-gray-200 duration-300 px-3 text-2xl font-normal rounded-full"
                    >
                      &#x2715;
                    </button>{" "}
                  </div>
                  <hr className="mb-4" />
                  <div className="mb-4 ">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="first_name"
                    >
                      First Name
                    </label>
                    <input
                      autoComplete="off"
                      id="first_name"
                      type="text"
                      {...register("first_name")}
                      className={`resize-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none`}
                    />
                  </div>
                  <div className="mb-4 ">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="last_name"
                    >
                      Last Name
                    </label>
                    <input
                      autoComplete="off"
                      id="last_name"
                      type="text"
                      {...register("last_name")}
                      className={`resize-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none`}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="tracking-wide outline-none focus:outline-none rounded py-2 border-2 border-[#98A2B3] mt-4 flex-grow"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <LoadingButton
                      loading={loading}
                      type="submit"
                      className={`login-btn-gradient text-white tracking-wide outline-none focus:outline-none rounded ${loading ? "py-1 px-4" : "py-2"} mt-4 flex-grow`}
                    >
                      Update
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
