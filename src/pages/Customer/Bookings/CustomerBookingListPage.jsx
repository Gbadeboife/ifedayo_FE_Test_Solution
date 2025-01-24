import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/globalContext";
import { useSearchParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import NoteIcon from "@/components/frontend/icons/NoteIcon";
import { isValidDate, parseSearchParams } from "@/utils/utils";
import MkdSDK from "@/utils/MkdSDK";
import CustomerBookingCard from "./CustomerBookingCard";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import CustomSelectV2 from "@/components/CustomSelectV2";
import DatePickerV3 from "@/components/DatePickerV3";
import CustomerBookingFiltersModal from "./CustomerBookingFiltersModal";
import { AuthContext, tokenExpireError } from "@/authContext";

const sdk = new MkdSDK();
const ctrl = new AbortController();

export default function CustomerBookingListPage() {
  const FETCH_PER_SCROLL = 12;

  const [showFilter, setShowFilter] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [render, forceRender] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookingsTotal, setBookingsTotal] = useState(100);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  const [favoriteStatuses, setFavoriteStatuses] = useState([]);
  const user_id = +localStorage.getItem("user") || 0;

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

  const direction = watch("direction");
  const fromDate = watch("from");

  const onSubmit = async (data) => {
    if (window.innerWidth < 700) {
      setShowFilter(false);
    }
    console.log("submitting", data);
    setBookings([]);
    searchParams.set("id", data.id);
    searchParams.set("host_name", data.host_name);
    searchParams.set("status", data.status);
    searchParams.set("from", dirtyFields?.from ? data.from.toISOString().split("T")[0] : "");
    searchParams.set("to", dirtyFields?.to ? data.to.toISOString().split("T")[0] : "");
    setSearchParams(searchParams);
  };

  async function fetchMyBookings(page) {
    // only add empty spaces if there's no empty card i.e we are not currently fetching
    if (bookings.every((bk) => Object.keys(bk).length > 0)) {
      setBookings((prev) => {
        const amountToFetch = bookingsTotal - prev.length > FETCH_PER_SCROLL ? FETCH_PER_SCROLL : Math.abs(bookingsTotal - prev.length - FETCH_PER_SCROLL);
        return [...prev, ...Array(amountToFetch).fill({})];
      });
    }
    const filters = parseSearchParams(searchParams);

    var where = [`ergo_booking.customer_id = ${user_id} AND ergo_booking.deleted_at IS NULL`];

    if (filters.host_name) {
      where.push(`(ergo_user.first_name LIKE '%${filters.host_name}%' OR ergo_user.last_name LIKE '%${filters.host_name}%'`);
    }

    if (filters.from) {
      where.push(`ergo_booking.booking_start_time >= date('${filters.from}')`);
    }

    if (filters.to) {
      where.push(`ergo_booking.booking_end_time <= date('${filters.to}')`);
    }

    if (filters.space_name) {
      where.push(`ergo_property.name LIKE '%${filters.space_name}%'`);
    }

    if (filters.status) {
      if (filters.status == "expired") {
        where.push(`ergo_booking.booking_start_time < date('${new Date().toISOString()}')`);
      } else {
        where.push(`ergo_booking.status = ${filters.status} AND ergo_booking.booking_start_time > date('${new Date().toISOString()}')`);
      }
    }

    if (filters.id) {
      where = [`ergo_booking.customer_id = ${user_id} AND ergo_booking.id = ${filters.id}`];
    }

    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/booking/PAGINATE", { page: page ?? 1, limit: FETCH_PER_SCROLL, where, sortId: "update_at", direction: "DESC" }, "POST", ctrl.signal);
      if (Array.isArray(result.list)) {
        setBookings((prev) => {
          return [...prev.filter((item) => Object.keys(item).length > 0), ...result.list].filter((v, i, a) => a.findIndex((v2) => v2.id === v.id) === i);
        });
        setBookingsTotal(result.total);
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

  async function fetchFavoriteStatuses() {
    const payload = { user_id: `${user_id}` };
    sdk.setTable("user_property_spaces");
    try {
      const result = await sdk.callRestAPI({ payload }, "GETALL");
      if (Array.isArray(result.list)) {
        setFavoriteStatuses(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") {
        globalDispatch({ type: "STOP_LOADING" });
        return;
      }
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  useEffect(() => {
    fetchMyBookings();
  }, [searchParams]);

  useEffect(() => {
    if (render) {
      fetchFavoriteStatuses();
      setBookings([]);
      fetchMyBookings(1);
    }
  }, [render]);

  useEffect(() => {
    fetchFavoriteStatuses();
  }, []);

  const sortByDate = (a, b) => {
    if (direction == "DESC") {
      return new Date(b.update_at) - new Date(a.update_at);
    }
    return new Date(a.update_at) - new Date(b.update_at);
  };

  return (
    <div className="min-h-screen bg-white pt-[44px] pb-40 text-sm md:text-base">
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
            <div className="z-10 flex min-w-[190px] items-center gap-2 rounded-md border bg-white px-2">
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
            <div className="z-10 flex min-w-[190px] items-center gap-2 rounded-md border bg-white px-2">
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
            <input
              type="text"
              placeholder="Host name"
              className="max-w-[180px] rounded-md border p-2 focus:outline-none active:outline-none"
              {...register("host_name")}
            />
            <input
              type="text"
              placeholder="Space name"
              className="max-w-[180px] rounded-md border p-2 focus:outline-none active:outline-none"
              {...register("space_name")}
            />
            <CustomSelectV2
              items={[
                { label: "All", value: "" },
                { label: "Pending", value: 0 },
                { label: "Upcoming", value: 1 },
                { label: "Ongoing", value: 2 },
                { label: "Completed", value: 3 },
                { label: "Declined", value: 4 },
                { label: "Expired", value: "expired" },
              ]}
              labelField="label"
              valueField="value"
              containerClassName="flex-grow max-w-xs min-w-[10rem]"
              className={`w-full border py-2 px-3`}
              placeholder={"All"}
              control={control}
              name="status"
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
      {bookings.length == 0 && (
        <div className="flex min-h-[300px] items-center justify-center normal-case text-[#667085]">
          <h2 className="flex gap-3">
            <NoteIcon /> You have no bookings
          </h2>
        </div>
      )}
      <InfiniteScroll
        overflow
        dataLength={bookings.length}
        next={() => {
          console.log("calling next", bookings.length / FETCH_PER_SCROLL + 1);
          fetchMyBookings(Math.round(bookings.length / FETCH_PER_SCROLL + 1));
        }}
        scrollThreshold={0.9}
        hasMore={bookings.length < bookingsTotal}
        loader={<></>}
        endMessage={
          bookings.length > 10 && (
            <p className="text-center normal-case">
              <b></b>
            </p>
          )
        }
      >
        {bookings.sort(sortByDate).map((book, i) => (
          <CustomerBookingCard
            data={book}
            key={book.id ?? i}
            forceRender={forceRender}
            favoriteId={favoriteStatuses.find((fav) => fav.property_spaces_id == book.property_space_id)?.id ?? null}
          />
        ))}
      </InfiniteScroll>
      <CustomerBookingFiltersModal
        modalOpen={showFilter}
        closeModal={() => setShowFilter(false)}
      />
    </div>
  );
}
