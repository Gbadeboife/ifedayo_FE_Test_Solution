import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import { useContext } from "react";
import moment from "moment";
import { BOOKING_STATUS } from "@/utils/constants";
import { LoadingButton } from "@/components/frontend";
import { monthsMapping } from "@/utils/date-time-utils";
import { parseJsonSafely } from "@/utils/utils";
import { GlobalContext } from "@/globalContext";

const sdk = new MkdSDK();
const ctrl = new AbortController();

export default function AcceptBookingModal({ modalOpen, closeModal, booking, onSuccess }) {
  const { dispatch: authDispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  async function acceptBooking() {
    setLoading(true);
    try {
      await sdk.callRawAPI("/v2/api/custom/ergo/capture", { booking_id: booking.id, status: 1, stripe_payment_intent_id: booking.stripe_payment_intent_id }, "POST");
      sendAcceptEmailToCustomer(
        booking.customer_id,
        booking.property_name,
        `from ${moment(booking.booking_start_time).format("MM/DD/YYYY")} to ${moment(booking.booking_end_time).format("MM/DD/YYYY")}`,
      );
      closeModal();
      onSuccess();
    } catch (err) {
      tokenExpireError(authDispatch, err.message);
      if (err.name == "AbortError") {
        setLoading(false);
        return;
      }
      closeModal();
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

  async function sendAcceptEmailToCustomer(id, space_name, time) {
    try {
      // get user email and preferences
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/get-user", { id }, "POST", ctrl.signal);

      if (parseJsonSafely(result.settings, {}).email_on_booking_accepted == true) {
        const tmpl = await sdk.getEmailTemplate("booking-accepted");
        const body = tmpl.html?.replace(new RegExp("{{{space_name}}}", "g"), space_name).replace(new RegExp("{{{time}}}", "g"), time);

        await sdk.sendEmail(result.email, tmpl.subject, body);
      }
    } catch (err) { }
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
                  <p className="text-sm text-gray-500">
                    You are about to accept a booking from{" "}
                    <b>
                      {booking.customer_first_name} {booking.customer_last_name}
                    </b>{" "}
                    for <b>{booking.property_name} </b>on{" "}
                    <b>
                      {monthsMapping[new Date(booking.booking_start_time).getMonth()] + " " + new Date(booking.booking_start_time).getDate() + "/" + new Date(booking.booking_start_time).getFullYear()}
                    </b>
                    .
                  </p>{" "}
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  <strong>Note: </strong> all other bookings within this time slot will be automatically declined
                </p>

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
                    onClick={acceptBooking}
                  >
                    Accept
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
