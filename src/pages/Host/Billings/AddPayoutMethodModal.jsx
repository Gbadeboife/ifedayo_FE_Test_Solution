import { GlobalContext } from "@/globalContext";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import { useContext } from "react";
import { LoadingButton } from "@/components/frontend";
import { useForm } from "react-hook-form";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export default function AddPayoutMethodModal({ modalOpen, closeModal, onSuccess }) {
  const schema = yup.object({
    account_number: yup.string().required("Enter Account Number").label("Account Number"),
    account_number2: yup.string()
      .oneOf([yup.ref("account_number"), null], "Account Numbers Must Match"),
    routing_number: yup.string().required("Enter Routing Number").label("Routing Number"),
    routing_number2: yup.string()
      .oneOf([yup.ref("routing_number"), null], "Routing Numbers Must Match"),
  });

  const { formState, handleSubmit, register, reset, formState: { errors }, } = useForm({ resolver: yupResolver(schema), defaultValues: { routing_number: "", account_number: "", account_number2: "", account_name: "" } });
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { dispatch, state } = useContext(AuthContext);
  const [ctrl] = useState(new AbortController());

  const onSubmit = async (data) => {
    try {
      const sdk = new MkdSDK();
      sdk.setTable("payout_method");
      await sdk.callRestAPI({ host_id: state.user, account_name: data?.account_name, account_number: data?.account_number, routing_number: data?.routing_number }, "POST", ctrl.signal);
      closeModal();
      onSuccess();
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") return;
      reset();
      closeModal();
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          message: err.message,
        },
      });
    }
  };


  return (
    <Transition
      appear
      show={modalOpen || globalState.addPayoutMethodModal}
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
                className="eleventh-step w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="mb-[18px] flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold md:text-xl"
                  >
                    Add Payout Method
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-full border p-1 px-3 text-2xl font-normal duration-100 hover:bg-gray-200 active:bg-gray-300"
                    onClick={closeModal}
                  >
                    &#x2715;
                  </button>
                </div>
                <div className="mb-4 ">
                  <label className="mb-2 block text-sm font-bold text-gray-700">Routing number</label>
                  <input
                    type="text"
                    required
                    {...register("routing_number")}
                    className="w-full rounded border py-2 px-3 text-sm leading-tight text-gray-700 focus:outline-none"
                  />
                </div>
                <div className="mb-4 ">
                  <label className="mb-2 block text-sm font-bold text-gray-700">Confirm Routing number</label>
                  <input
                    type="text"
                    required
                    {...register("routing_number2")}
                    className="w-full rounded border py-2 px-3 text-sm leading-tight text-gray-700 focus:outline-none"
                  />
                  <p className="text-red-500 pt-2 text-xs italic">
                    {errors.routing_number2?.message}
                  </p>
                </div>
                <div className="mb-4 ">
                  <label className="mb-2 block text-sm font-bold text-gray-700">Account number</label>
                  <input
                    type="text"
                    required
                    {...register("account_number")}
                    className={`w-full rounded border py-2 px-3 text-sm leading-tight text-gray-700 focus:outline-none`}
                  />
                </div>
                <div className="mb-4 ">
                  <label className="mb-2 block text-sm font-bold text-gray-700">Confirm Account number</label>
                  <input
                    type="text"
                    required
                    {...register("account_number2")}
                    className={`w-full rounded border py-2 px-3 text-sm leading-tight text-gray-700 focus:outline-none`}
                  />
                  <p className="text-red-500 pt-2 text-xs italic">
                    {errors.account_number2?.message}
                  </p>
                </div>
                <div className="mb-4 ">
                  <label className="mb-2 block text-sm font-bold text-gray-700">Account holder name</label>
                  <input
                    type="text"
                    required
                    {...register("account_name")}
                    className={`w-full rounded border py-2 px-3 text-sm leading-tight text-gray-700 focus:outline-none`}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    className="mt-4 flex-grow rounded border-2 border-[#98A2B3] py-2 tracking-wide outline-none focus:outline-none"
                    onClick={() => {
                      ctrl.abort();
                      closeModal();
                    }}
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    loading={formState.isSubmitting}
                    type="submit"
                    className={`login-btn-gradient mt-4 flex-grow rounded ${formState.isSubmitting ? "py-1 px-4" : "py-2"} tracking-wide text-white outline-none focus:outline-none`}
                  >
                    Add payout method
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
