import { BOOKING_STATUS } from "@/utils/constants";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function MultipleBookingErrorModal({ modalOpen, closeModal, spaceId }) {
  const [bookingId, setBookingId] = useState("");

  async function fetchBooking() {
    const sdk = new MkdSDK();
    sdk.setTable("booking");
    try {
      const result = await sdk.callRestAPI(
        { page: 1, limit: 1, payload: { property_space_id: spaceId, customer_id: +localStorage.getItem("user"), status: BOOKING_STATUS.PENDING }, sortId: "id", direction: "DESC" },
        "PAGINATE",
      );
      if (Array.isArray(result.list) && result.list.length > 0) {
        setBookingId(result.list[0].id);
      }
    } catch (err) {
      console.log("err", err);
    }
  }

  useEffect(() => {
    fetchBooking();
  }, [spaceId]);
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
                  className="text-2xl font-medium leading-6 text-gray-900"
                >
                  This is a duplicate request
                </Dialog.Title>
                <div className="my-4">
                  <p className="text-lg text-gray-500">Once your host approves this booking, you will be able to enjoy your reservation! </p>
                </div>

                <div className="mt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none"
                    onClick={closeModal}
                  >
                    OK got it
                  </button>
                  <Link
                    to={"/account/my-bookings/" + bookingId}
                    className={`login-btn-gradient inline-flex justify-center rounded-md py-2 px-4 text-sm font-medium text-white`}
                  >
                    View Status
                  </Link>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
