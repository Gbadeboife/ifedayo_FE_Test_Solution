import { AuthContext } from "@/authContext";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import { LoadingButton } from "@/components/frontend";
import { CardElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useParams } from "react-router";
import MkdSDK from "@/utils/MkdSDK";
let sdk = new MkdSDK();


export default function PayBookingModal({ setConfirmPayment, modalOpen, closeModal, onSuccess, clientSecret, booking_id, paymentMethod }) {
  const stripe = useStripe();
  const elements = useElements();
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    console.log("submitting");
    try {
      if (!stripe || !elements) {
        return;
      }
      const resultData = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      })
      const result = await sdk.callRawAPI(`/v2/api/custom/ergo/pay-hold`, { booking_id, user_id: Number(localStorage.getItem("user")), payment_method: resultData?.paymentMethod?.id }, "POST");
      if (result.error) {
        throw new Error(error.message);
      }
      setConfirmPayment(true)
      closeModal();
      globalDispatch({
        type: "SHOW_CONFIRMATION", payload: {
          heading: "Payment Successful", message: "Booking successful", btn: "OK", onClose: async () => {
            await onSuccess(id);
          }
        }
      });
    } catch (err) {
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Payment failed", message: err.message } });
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!clientSecret) {
      return;
    }
  }, [])


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
              <Dialog.Panel
                className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                as="form"
                onSubmit={onSubmit}
              >
                <Dialog.Title
                  as="h3"
                  className="text-xl font-medium leading-6 text-gray-900"
                >
                  Payment
                </Dialog.Title>
                <div className="mt-4"></div>
                <CardElement
                />
                <div className="mt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    className="inline-flex w-1/2 justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    loading={loading}
                    type="submit"
                    className={`inline-flex w-1/2 justify-center rounded-md ${loading ? "py-1 px-6" : "py-2 px-4"} login-btn-gradient text-sm font-medium text-white`}
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
