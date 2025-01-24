import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import CustomSelect from "./CustomSelect";
import ReviewCard from "./ReviewCard";

export default function AllReviewsModal({ modalOpen, closeModal, reviews, onDirectionChange }) {
  return (
    <Transition
      appear
      show={modalOpen}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-50"
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
          <div className="fixed inset-0 bg-red-800" />
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
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex md:flex-row flex-col gap-4 justify-between items-center">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-gray-900"
                  >
                    All Reviews ({reviews.length})
                  </Dialog.Title>
                  <div className="flex gap-8 items-start">
                    <CustomSelect
                      options={[
                        { label: "By Date: Newest First", value: "DESC" },
                        { label: "By Date: Oldest First", value: "ASC" },
                      ]}
                      onChange={onDirectionChange}
                      accessor="label"
                      valueAccessor="value"
                      className="min-w-[200px]"
                    />
                    <button
                      onClick={closeModal}
                      className="p-1 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full"
                    >
                      &#x2715;
                    </button>
                  </div>
                </div>
                <hr className="my-8" />
                <section className="overflow-y-auto h-[70vh] review-scroll pr-[13px]">
                  {reviews.map((rw) => (
                    <ReviewCard
                      key={rw.id}
                      data={rw}
                    />
                  ))}
                </section>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
