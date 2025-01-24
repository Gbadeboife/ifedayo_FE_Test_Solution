import DatePickerV3 from "@/components/DatePickerV3";
import { isValidDate, parseSearchParams } from "@/utils/utils";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

const statuses = [
  { label: "Pending", value: 0 },
  { label: "Upcoming", value: 1 },
  { label: "Ongoing", value: 2 },
  { label: "Completed", value: 3 },
  { label: "Declined", value: 4 },
  { label: "Expired", value: "expired" },
];

export default function CustomerBookingFiltersModal({ modalOpen, closeModal }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleSubmit, register, watch, reset, setValue, control, formState, resetField } = useForm({
    defaultValues: (() => {
      const params = parseSearchParams(searchParams);
      return {
        host_name: params.host_name ?? "",
        from: isValidDate(params.from ?? "") ? new Date(params.from) : new Date(),
        to: isValidDate(params.to ?? "") ? new Date(params.to) : new Date(),
        space_name: params.space_name ?? "",
        status: params.status ?? "",
        id: params.id ?? "",
        direction: "DESC",
      };
    })(),
  });

  const { dirtyFields } = formState;

  const fromDate = watch("from");

  const onSubmit = async (data) => {
    console.log("submitting ", data);
    searchParams.set("id", data.id);
    searchParams.set("host_name", data.host_name);
    searchParams.set("space_name", data.space_name);
    searchParams.set("status", data.status);
    searchParams.set("from", dirtyFields?.from ? data.from.toISOString().split("T")[0] : "");
    searchParams.set("to", dirtyFields?.to ? data.to.toISOString().split("T")[0] : "");
    setSearchParams(searchParams);
    closeModal();
  };

  return (
    <Transition
      appear
      show={modalOpen && window.innerWidth < 700}
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
                className="tiny-scroll max-h-fit w-full max-w-md transform overflow-hidden overflow-y-auto rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                as="form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="mb-[18px] flex items-center justify-between">
                  <div className="flex gap-4">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-semibold"
                    >
                      Filters
                    </Dialog.Title>
                    <button
                      type="button"
                      className="text-sm text-gray-800 underline"
                      onClick={() =>
                        reset(
                          {
                            id: "",
                            from: new Date(),
                            to: new Date(),
                            host_name: "",
                            status: "",
                            space_name: "",
                            direction: "DESC",
                          },
                          { keepDirty: false },
                        )
                      }
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-lg rounded-full border p-1 px-3 font-normal duration-300 hover:bg-gray-200 md:text-2xl"
                  >
                    &#x2715;
                  </button>{" "}
                </div>
                <hr className="my-[10px]" />
                <div className="space-y-6">
                  <input
                    type="text"
                    placeholder="ID"
                    className="my-[16px] w-full rounded-md border p-2 focus:outline-none active:outline-none"
                    {...register("id")}
                  />
                  <div className="my-[16px] flex gap-2">
                    <div className="flex w-1/2 items-center gap-2 whitespace-nowrap rounded-md border bg-white p-2">
                      <DatePickerV3
                        reset={() => resetField("from", { keepDirty: false, keepTouched: false })}
                        setValue={(val) => setValue("from", val, { shouldDirty: true })}
                        control={control}
                        name="from"
                        labelClassName="justify-between flex-grow flex-row-reverse"
                        placeholder="From"
                        min={new Date("2001-01-01")}
                      />
                    </div>
                    <div className="flex w-1/2 items-center gap-2 rounded-md border bg-white p-2">
                      <DatePickerV3
                        reset={() => resetField("to", { keepDirty: false, keepTouched: false })}
                        setValue={(val) => setValue("to", val, { shouldDirty: true })}
                        control={control}
                        name="to"
                        labelClassName="justify-between flex-grow flex-row-reverse"
                        placeholder="To"
                        min={fromDate}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Host name"
                    className="my-[16px] w-full rounded-md border p-2 focus:outline-none active:outline-none"
                    {...register("host_name")}
                  />
                  <input
                    type="text"
                    placeholder="Space name"
                    className="my-[16px] w-full rounded-md border p-2 focus:outline-none active:outline-none"
                    {...register("space_name")}
                  />
                  <select
                    className="w-full cursor-pointer border bg-white py-2 px-3 focus:outline-none"
                    {...register("status")}
                  >
                    <option value="">All</option>
                    {statuses.map((st) => (
                      <option
                        key={st.value}
                        value={st.value}
                      >
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="login-btn-gradient mt-4 w-full rounded py-2 tracking-wide text-white  outline-none focus:outline-none"
                >
                  Apply and close
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
