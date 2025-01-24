import React, { useRef } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import NextIcon from "@/components/frontend/icons/NextIcon";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { callCustomAPI } from "@/utils/callCustomAPI";
import DatePicker from "@/components/frontend/DatePicker";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import CustomSelect from "@/components/frontend/CustomSelect";
import InfiniteScroll from "react-infinite-scroll-component";
import NoteIcon from "@/components/frontend/icons/NoteIcon";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import { ID_VERIFICATION_STATUSES } from "@/utils/constants";
import MySpaceCard from "./MySpaceCard";
import CustomSelectV2 from "@/components/CustomSelectV2";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import DatePickerV3 from "@/components/DatePickerV3";
import { formatDate, increaseDate, isValidDate, parseSearchParams } from "@/utils/utils";
import MkdSDK from "@/utils/MkdSDK";
import { AuthContext, tokenExpireError } from "@/authContext";
import MySpacesFiltersModal from "./MySpacesFiltersModal";
import DatePickerV2 from "@/components/frontend/DatePickerV2";

const sdk = new MkdSDK();
const ctrl = new AbortController();

export default function MySpacesListPage() {
  const FETCH_PER_SCROLL = 12;
  const [searchParams, setSearchParams] = useSearchParams();
  const [spaces, setSpaces] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [render, forceRender] = useState(false);
  const navigate = useNavigate();

  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  const [spacesTotal, setSpacesTotal] = useState(100);

  const { handleSubmit, register, watch, reset, setValue, control, formState, resetField } = useForm({
    defaultValues: (() => {
      const params = parseSearchParams(searchParams);
      return {
        id: params.id ?? "",
        space_name: params.guest_name ?? "",
        from: isValidDate(params.from ?? "") ? new Date(params.from) : new Date(),
        to: isValidDate(params.to ?? "") ? new Date(params.to) : new Date(),
        availability: params.availability ?? "",
        space_status: params.space_status ?? "",
        direction: "DESC",
      };
    })(),
  });

  const { dirtyFields } = formState;

  const direction = watch("direction");
  const fromDate = watch("from");

  const onSubmit = async (data) => {
    if (window.innerWidth < 700) {
      setShowFilter(false);
    }
    setSpaces([]);
    const formatTo = formatDate(data.to)
    const formatFrom = formatDate(data.from)

    searchParams.set("id", data.id);
    searchParams.set("space_name", data.space_name);
    searchParams.set("space_status", data.space_status);
    searchParams.set("from", dirtyFields?.from ? formatFrom : "");
    searchParams.set("to", dirtyFields?.to ? formatTo : new Date().toISOString().split("T")[0]);
    searchParams.set("availability", data.availability);
    setSearchParams(searchParams);
    fetchMySpaces()
  };
  async function fetchMySpaces(page) {
    const host_id = +localStorage.getItem("user");
    setSpaces((prev) => {
      const amountToFetch = spacesTotal - prev.length > FETCH_PER_SCROLL ? FETCH_PER_SCROLL : Math.abs(spacesTotal - prev.length - FETCH_PER_SCROLL);
      return [...prev, ...Array(amountToFetch).fill({})];
    });

    const filters = parseSearchParams(searchParams);

    let where = [`ergo_property.host_id = ${host_id} AND ergo_property_spaces.deleted_at IS NULL`];

    if (filters.space_name) {
      where.push(`ergo_property.name LIKE '%${filters.space_name}%'`);
    }

    if (filters.from !== undefined && filters.to === undefined) {
      where.push(`ergo_property_spaces.create_at = ${filters.from}`)
    }

    if (filters.to === undefined && filters.from !== undefined) {
      where.push(`ergo_property_spaces.create_at = ${filters.to}`)
    }
    if (filters.to && filters.from) {
      where.push(`ergo_property_spaces.create_at BETWEEN '${filters.from}' AND  '${filters.to}'`)
    }

    if (Number(filters.space_status) < 3) {
      where.push(`ergo_property_spaces.space_status = ${filters.space_status} AND ergo_property_spaces.draft_status > 2`);
    }
    if (Number(filters.space_status) === 3) {
      where.push(`ergo_property_spaces.draft_status < 3`);
    }

    if (filters.availability === "1") {
      where.push(`ergo_property_spaces.availability = ${filters.availability} AND ergo_property_spaces.draft_status > 2 AND ergo_property_spaces.space_status = 1`);
    }
    if (filters.availability === "0") {
      where.push(`ergo_property_spaces.availability = ${filters.availability} AND ergo_property_spaces.draft_status > 2 AND ergo_property_spaces.space_status = 0`);
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

  useEffect(() => {
    fetchMySpaces();
  }, []);

  useEffect(() => {
    if (render) {
      setSpaces([]);
      fetchMySpaces();
    }
  }, [render]);

  const sortByDate = (a, b) => {
    if (direction == "DESC") {
      return new Date(b.id) - new Date(a.id);
    }
    return new Date(a.id) - new Date(b.id);
  };

  return (
    <div className="min-h-screen bg-white px-3 pt-[20px]">
      <div className="mb-8 flex justify-end fourteen-step">
        <button
              className="rounded-md border border-black hover:border-gray-200 p-2 px-6 hover:bg-gray-200"
              onClick={() => navigate("/spaces/add")}
            >
              Add New Space
            </button>
      </div>
      <section>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 text-sm md:text-base"
        >
          <div className="mb-[30px] flex justify-between gap-4 md:gap-0">
            <button
              type="button"
              className="flex flex-grow items-center justify-between gap-2 rounded-md border p-2 md:max-w-[120px]"
              onClick={() => setShowFilter((prev) => !prev)}
            >
              <span>Filters</span>
              <AdjustmentsHorizontalIcon className="h-6 w-6" />
            </button>
            <CustomSelectV2
              items={[
                { label: "By Date: Newest First", value: "DESC" },
                { label: "By Date: Oldest First", value: "ASC" },
              ]}
              labelField="label"
              valueField="value"
              containerClassName="h-full w-full max-w-[12rem]"
              className={`w-full border py-2 px-3`}
              placeholder={"By Date: Newest First"}
              control={control}
              name="direction"
            />
          </div>
          <div className={` ${showFilter ? "md:flex" : "hidden"} animate-filter hidden flex-wrap gap-[12px] gap-y-[20px]`}>
            <div className="z-10 min-w-[190px] rounded-md bg-white h-fit">
              <DatePickerV2
                reset={() => resetField("from", { keepDirty: false, keepTouched: false })}
                setValue={(val) => setValue("from", val, { shouldDirty: true })}
                control={control}
                name="from"
                labelClassName="justify-between max-h-[50px] flex-grow flex-row-reverse"
                placeholder="From"
                type="space"
                min={new Date("2001-01-01")}
              />
            </div>
            <div className="z-10 min-w-[190px] rounded-md bg-white">
              <DatePickerV2
                reset={() => resetField("to", { keepDirty: false, keepTouched: false })}
                setValue={(val) => setValue("to", val, { shouldDirty: true })}
                control={control}
                name="to"
                labelClassName="justify-between flex-grow flex-row-reverse"
                placeholder="To"
                type="space"
                min={new Date("2001-01-01")}
              />
            </div>
            <input
              type="text"
              placeholder="Space name"
              className="max-w-[180px] rounded-md border p-2 focus:outline-none active:outline-none"
              {...register("space_name")}
            />
            <CustomSelectV2
              items={[
                { label: "Status: All", value: "" },
                { label: "Under Review", value: 0 },
                { label: "Approved", value: 1 },
                { label: "Declined", value: 2 },
                { label: "Draft", value: 3 },
              ]}
              labelField="label"
              valueField="value"
              containerClassName="flex-grow max-w-xs min-w-[10rem]"
              className={`w-full border py-2 px-3`}
              placeholder={"Status: All"}
              control={control}
              name="space_status"
            />
            <CustomSelectV2
              items={[
                { label: "Visibility: All", value: "" },
                { label: "Hidden", value: 0 },
                { label: "Visible", value: 1 },
              ]}
              labelField="label"
              valueField="value"
              containerClassName="flex-grow max-w-xs min-w-[10rem]"
              className={`w-full border py-2 px-3`}
              placeholder={"Visibility: All"}
              control={control}
              name="availability"
            />
            <button
              type="submit"
              className="rounded-md border border-black p-2 px-6"
            >
              Search
            </button>
          </div>
        </form>
      </section>
      {spaces.length == 0 && (
        <div className="flex min-h-[300px] items-center justify-center normal-case text-[#667085]">
          <h2 className="flex gap-3">
            <NoteIcon /> You have no spaces
          </h2>
        </div>
      )}
      <InfiniteScroll
        dataLength={spaces.length}
        next={() => {
          fetchMySpaces(Math.round(spaces.length / FETCH_PER_SCROLL + 1));
        }}
        scrollThreshold={0.9}
        hasMore={spaces.length < spacesTotal}
        loader={<></>}
        endMessage={
          spaces.length > 10 && (
            <p className="text-center normal-case">
              <b></b>
            </p>
          )
        }
        className="pb-20"
      >
        {spaces.sort(sortByDate).map((space, i) => (
          <MySpaceCard
            data={space}
            key={space.id ?? i}
            forceRender={forceRender}
            reset={reset}
          />
        ))}
      </InfiniteScroll>
      <MySpacesFiltersModal
        modalOpen={showFilter}
        closeModal={() => setShowFilter(false)}
        setSpaces={setSpaces}
        forceRender={forceRender}
        spacesTotal={spacesTotal}
        FETCH_PER_SCROLL={FETCH_PER_SCROLL}
        setSpacesTotal={setSpacesTotal}
      />
    </div>
  );
}
