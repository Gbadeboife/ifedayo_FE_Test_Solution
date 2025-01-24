import { AuthContext, tokenExpireError } from "@/authContext";
import DatePickerV3 from "@/components/DatePickerV3";
import DatePickerV2 from "@/components/frontend/DatePickerV2";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { formatDate, isValidDate, parseSearchParams } from "@/utils/utils";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useContext } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

const sdk = new MkdSDK();
const ctrl = new AbortController();

const statuses = [
  { label: "Under Review", value: 0 },
  { label: "Approved", value: 1 },
  { label: "Declined", value: 2 },
];

const visibilityStatuses = [
  { label: "Hidden", value: 0 },
  { label: "Visible", value: 1 },
];

export default function MySpacesFiltersModal({ modalOpen, closeModal, setSpaces, FETCH_PER_SCROLL, spacesTotal, setSpacesTotal, forceRender }) {
  const { dispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const { handleSubmit, register, watch, reset, setValue, control, formState, resetField } = useForm({
    defaultValues: (() => {
      const params = parseSearchParams(searchParams);
      return {
        id: params.id ?? "",
        space_name: params.space_name ?? "",
        from: isValidDate(params.from ?? "") ? new Date(params.from) : new Date(),
        to: isValidDate(params.to ?? "") ? new Date(params.to) : new Date(),
        space_status: params.space_status ?? "",
        availability: params.availability ?? "",
        direction: "DESC",
      };
    })(),
  });

  const { dirtyFields } = formState;

  const fromDate = watch("from");

  const onSubmit = async (data) => {
    const formatTo = formatDate(data.to)
    const formatFrom = formatDate(data.from)

    searchParams.set("id", data.id);
    searchParams.set("space_name", data.space_name);
    searchParams.set("space_status", data.space_status);
    searchParams.set("from", dirtyFields?.from ? formatFrom : "");
    searchParams.set("to", dirtyFields?.to ? formatTo : new Date().toISOString().split("T")[0]);
    searchParams.set("availability", data.availability);
    setSearchParams(searchParams);
    fetchMySpaces();
    closeModal();
  };

  async function fetchMySpaces(page) {
    const host_id = +localStorage.getItem("user");
    setSpaces((prev) => {
      const amountToFetch = spacesTotal - prev.length > FETCH_PER_SCROLL ? FETCH_PER_SCROLL : Math.abs(spacesTotal - prev.length - FETCH_PER_SCROLL);
      return [...prev, ...Array(amountToFetch).fill({})];
    });

    const filters = parseSearchParams(searchParams);

    var where = [`ergo_property.host_id = ${host_id} AND ergo_property_spaces.deleted_at IS NULL`];

    if (filters.space_name) {
      where.push(`ergo_property.name LIKE '%${filters.space_name}%'`);
    }

    if (filters.from && filters.to === undefined) {
      where.push(`ergo_property_spaces.create_at = ${filters.from}`)
    }

    if (filters.to && filters.from === undefined) {
      where.push(`ergo_property_spaces.create_at = ${filters.to}`)
    }
    if (filters.to && filters.from) {
      where.push(`ergo_property_spaces.create_at BETWEEN '${filters.from}' AND  '${filters.to}'`)
    }

    if (filters.space_status) {
      where.push(`ergo_property_spaces.space_status = ${filters.space_status} AND ergo_property_spaces.draft_status > 2`);
    }

    if (filters.availability === "1") {
      where.push(`ergo_property_spaces.availability = ${filters.availability} AND ergo_property_spaces.draft_status > 2 AND ergo_property_spaces.space_status = 1`);
    }
    if (filters.availability === "0") {
      where.push(`ergo_property_spaces.availability = ${filters.availability} AND ergo_property_spaces.draft_status > 2 `);
    }

    if (filters.id) {
      where = [`ergo_property.host_id = ${host_id} AND ergo_property_spaces.id = ${filters.id} AND ergo_property_spaces.deleted_at IS NULL`];
    }

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/popular/PAGINATE",
        { page: page ?? 1, limit: FETCH_PER_SCROLL, user_id: host_id, where, all: true, sortId: "update_at", direction: "DESC" },
        "POST",
        ctrl.signal,
      );

      if (Array.isArray(result.list)) {
        // setSpaces(result.list);
        setSpaces((prev) => {
          return [...prev.filter((item) => Object.keys(item).length > 0), ...result.list].filter((v, i, a) => a.findIndex((v2) => v2.id === v.id) === i);
        });
        setSpacesTotal(result.total);
      }
      forceRender(true)
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") return;
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

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
                            space_name: "",
                            from: new Date(),
                            to: new Date(),
                            availability: "",
                            space_status: "",
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
                    autoComplete="off"
                    className="mt-[24px] w-full rounded-md border p-2 focus:outline-none active:outline-none"
                    {...register("id")}
                  />
                  <div className="rounded-md bg-white">
                    <DatePickerV2
                      reset={() => resetField("from", { keepDirty: false, keepTouched: false })}
                      setValue={(val) => setValue("from", val, { shouldDirty: true })}
                      control={control}
                      name="from"
                      labelClassName="justify-between flex-grow flex-row-reverse"
                      placeholder="From"
                      type="space"
                      min={new Date("2001-01-01")}
                    />
                  </div>
                  <div className="rounded-md bg-white">
                    <DatePickerV2
                      reset={() => resetField("to", { keepDirty: false, keepTouched: false })}
                      setValue={(val) => setValue("to", val, { shouldDirty: true })}
                      control={control}
                      name="to"
                      labelClassName="justify-between flex-grow flex-row-reverse"
                      placeholder="To"
                      type="space"
                      min={fromDate}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Space name"
                    className="w-full rounded-md border px-2 py-3 focus:outline-none active:outline-none"
                    {...register("space_name")}
                  />

                  <select
                    className="w-full cursor-pointer border bg-white py-3 rounded px-3 focus:outline-none"
                    {...register("space_status")}
                  >
                    <option value="">Status: All</option>
                    {statuses.map((st) => (
                      <option
                        key={st.value}
                        value={st.value}
                      >
                        {st.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full cursor-pointer border bg-white py-3 rounded px-3 focus:outline-none"
                    {...register("availability")}
                  >
                    <option value="">Visibility: All</option>
                    {visibilityStatuses.map((st) => (
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
