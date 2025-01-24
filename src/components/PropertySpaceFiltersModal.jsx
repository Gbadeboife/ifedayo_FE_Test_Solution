import { GlobalContext } from "@/globalContext";
import { isValidDate, parseSearchParams } from "@/utils/utils";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useContext } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import CustomLocationAutoCompleteV2 from "./CustomLocationAutoCompleteV2";
import DatePickerV3 from "./DatePickerV3";

const prices = [
  {
    label: "All Prices",
    value: "",
  },
  {
    label: "$0 - $30",
    value: "$0 - $30",
  },
  {
    label: "$31 - $60",
    value: "$31 - $60",
  },
  {
    label: "$60 - $90",
    value: "$60 - $90",
  },
  {
    label: "$90 - $120",
    value: "$90 - $120",
  },
  {
    label: "$120 - $150",
    value: "$120 - $150",
  },
  {
    label: "$150 - $180",
    value: "$150 - $180",
  },
];

export default function PropertySpaceFiltersModal({ modalOpen, closeModal }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state: globalState } = useContext(GlobalContext);
  const { handleSubmit, register, watch, reset, setValue, control, formState, resetField } = useForm({
    defaultValues: (() => {
      const params = parseSearchParams(searchParams);
      return {
        location: params.location ?? "",
        from: isValidDate(params.from ?? "") ? new Date(params.from) : new Date(),
        to: isValidDate(params.to ?? "") ? new Date(params.to) : new Date(),
        space_name: params.space_name ?? "",
        category: params.category ?? "",
        price_range: params.price_range ?? "",
        direction: "DESC",
      };
    })(),
  });

  const { dirtyFields } = formState;

  const fromDate = watch("from");

  const onSubmit = async (data) => {
    console.log("submitting ", data);
    searchParams.set("category", data.category);
    searchParams.set("price_range", data.price_range);
    searchParams.set("space_name", data.space_name);
    searchParams.set("location", data.location);
    searchParams.set("from", dirtyFields?.from ? data.from.toISOString() : "");
    searchParams.set("to", dirtyFields?.to ? data.to.toISOString() : "");
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
                            location: "",
                            from: new Date(),
                            to: new Date(),
                            space_name: "",
                            category: "",
                            price_range: "",
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
                  <select
                    className="w-full cursor-pointer border bg-white py-2 px-3 focus:outline-none"
                    {...register("category")}
                  >
                    <option value="">All Categories</option>
                    {globalState.spaceCategories.map((sp) => (
                      <option
                        key={sp.id}
                        value={sp.category}
                      >
                        {sp.category}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full cursor-pointer border bg-white py-2 px-3 focus:outline-none"
                    {...register("price_range")}
                  >
                    <option value="">All Prices</option>
                    {prices.map((pr) => (
                      <option
                        key={pr.value}
                        value={pr.value}
                      >
                        {pr.label}
                      </option>
                    ))}
                  </select>
                  <CustomLocationAutoCompleteV2
                    control={control}
                    setValue={(val) => setValue("location", val)}
                    name="location"
                    className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none`}
                    placeholder="Location"
                    hideIcons
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
                        min={new Date()}
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
                    placeholder="Space name"
                    className="my-[16px] w-full rounded-md border p-2 focus:outline-none active:outline-none"
                    {...register("space_name")}
                  />
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
