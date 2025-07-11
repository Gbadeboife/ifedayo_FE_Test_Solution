import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PropertySpaceTile from "@/components/frontend/PropertySpaceTile";
import "react-calendar/dist/Calendar.css";
import { callCustomAPI } from "@/utils/callCustomAPI";
import PeopleIcon from "@/components/frontend/icons/PeopleIcon";
import { GlobalContext } from "@/globalContext";
import { useContext } from "react";
import CustomSelect from "@/components/frontend/CustomSelect";
import FilterIcon from "@/components/frontend/icons/FilterIcon";
import { Tooltip } from "react-tooltip";
import NoteIcon from "@/components/frontend/icons/NoteIcon";
import { formatDate } from "@/utils/date-time-utils";
import { DRAFT_STATUS, SPACE_STATUS } from "@/utils/constants";
import { useForm } from "react-hook-form";
import CustomLocationAutoCompleteV2 from "@/components/CustomLocationAutoCompleteV2";
import DatePickerV3 from "@/components/DatePickerV3";
import { isValidDate, parseSearchParams } from "@/utils/utils";
import FilterCheckBoxesV2 from "@/components/FilterCheckBoxesV2";
import MkdSDK from "@/utils/MkdSDK";
import useAmenityCategories from "@/hooks/api/useAmenityCategories";
import CustomStaticLocationAutoCompleteV2 from "@/components/CustomStaticLocationAutoCompleteV2";

const prices = [
  { name: "$0 - $30", id: 0 },
  { name: "$31 - $60", id: 1 },
  { name: "$60 - $90", id: 2 },
  { name: "$90 - $120", id: 3 },
  { name: "$120 - $150", id: 4 },
  { name: "$150 - $180", id: 5 },
];
const capacity = [
  { name: "0 - 4", id: 0 },
  { name: "5 - 9", id: 1 },
  { name: "10 - 14", id: 2 },
  { name: "15 - 19", id: 3 },
  { name: "20 - 24", id: 4 },
  { name: "25 - 30", id: 5 },
  { name: "Greater Than 30", id: 6 },
];

const reviews = [
  { name: "4", id: 0 },
  { name: "3", id: 1 },
  { name: "2", id: 2 },
  { name: "1", id: 3 },
];

const sdk = new MkdSDK();
const ctrl = new AbortController();

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);

  const [filterPopup, setFilterPopup] = useState(false);

  const spaceCategories = globalState.spaceCategories;
  const amenityCategories = useAmenityCategories();
  const [propertySpaces, setPropertySpaces] = useState([]);
  const [render, forceRender] = useState(false);

  const { handleSubmit, control, setValue, resetField, register } = useForm({
    defaultValues: (() => {
      const params = parseSearchParams(searchParams);
      return {
        ...params,
        location: params.location ?? "",
        booking_start_time: "",
        category: params.category?.split(",") || [],
        capacity: params.capacity?.split(",") || [],
        price: params.price?.split(",") || [],
        amenity: params.amenity?.split(",") || [],
        review: params.review?.split(",") || [],
      };
    })(),
  });
  const [sortAsc, setSortAsc] = useState(false);

  async function fetchSpaces() {
    const params = parseSearchParams(searchParams);
    const location = (params.location?.split(","))
    const d = new Date(params.booking_start_time || undefined);

    const filter = {
      ...params,
      booking_start_time: isNaN(d) ? undefined : d,
      category: params.category?.split(",") || [],
      price: params.price?.split(",") || [],
      capacity: params.capacity?.split(",") || [],
      amenity: params.amenity?.split(",") || [],
      review: params.review?.split(",") || [],
    };
    globalDispatch({ type: "START_LOADING" });

    // make sure only approved and non-draft spaces
    var where = [`ergo_property_spaces.space_status = ${SPACE_STATUS.APPROVED} AND schedule_template_id IS NOT NULL AND ergo_property_spaces_images.is_approved = 1 AND ergo_property_spaces.draft_status = ${DRAFT_STATUS.COMPLETED} AND ergo_property_spaces.deleted_at IS NULL`];

    // use data.location to search address, city, country and zip
    if (filter.location) {
      where.push(
        `(ergo_property.address_line_1 LIKE '%${filter.location}%' OR ergo_property.address_line_2 LIKE '%${filter.location}%' OR ergo_property.city LIKE '%${location[0] && location[0]}%' OR ergo_property.country LIKE '%${location.length === 1 ? location[0] : location.length === 2 ? location[1] : location[2]}%' OR ergo_property.zip LIKE '%${filter.location}%' OR ergo_property.name LIKE '%${filter.location}%')`,
      );
    }

    if (filter.size) {
      where.push(`ergo_property_spaces.size = ${filter.size}`);
    }

    if (filter.capacity.length > 0) {
      if (filter.capacity[filter.capacity.length-1] !== "Greater Than 30") {
        const str = filter.capacity[filter.capacity.length-1]; // Get the first (and only) element from the array
        const numbers = str.split('-').map(num => num.trim()); // Split the string and trim spaces
        const [num1, num2] = numbers; // Destructure the resulting array to get the numbers
        where.pop()
        where.push(
          `ergo_property_spaces.max_capacity BETWEEN ${num1} AND ${num2}`,
        );
      } else {
        where.push(
          `ergo_property_spaces.max_capacity > 30`,
        );
      }
    }

    if (filter.category.length > 0) {
      where.push(`(${filter.category.map((cg) => `ergo_spaces.category LIKE '%${cg}%'`).join(" OR ")})`);
    }

    if (filter.amenity.length > 0) {
      where.push(`(${filter.amenity.map((am) => `ergo_amenity.name LIKE '%${am}%'`).join(" OR ")})`);
    }

    if (filter.review.length > 0) {
      where.push(`(${filter.review.map((rv) => `ER.average_space_rating >= ${rv.replace("+", "")}`).join(" OR ")})`);
    }

    if (filter.price.length > 0) {
      where.push(
        `(${filter.price
          .filter((pr) => pr.trim() != "")
          .map((pr) => pr.split("-"))
          .map(([from, to]) => `ergo_property_spaces.rate BETWEEN ${from.trim().slice(1)} AND ${to.trim().slice(1)} `)
          .join(" OR ")})`,
      );
    }

    try {
      const user_id = Number(localStorage.getItem("user"));
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/popular/PAGINATE",
        { page: 1, limit: 10000, user_id: Number(user_id), where, booking_start_time: isValidDate(filter.booking_start_time || "") ? new Date(filter.booking_start_time).toISOString() : undefined },
        "POST",
        ctrl.signal,
      );
      setPropertySpaces(result.list);
    } catch (err) {
      console.log("err", err);
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
    if (isValidDate(searchParams.get("booking_start_time"))) {
      setValue("booking_start_time", new Date(searchParams.get("booking_start_time")), { shouldDirty: true });
    }
  }, []);

  useEffect(() => {
    if (render) {
      fetchSpaces();
    }
  }, [render]);

  const removeFilter = (searchField, arrEl) => {
    if (!arrEl) {
      setValue(searchField, "");
      searchParams.set(searchField, "");
      setSearchParams(searchParams);
    } else {
      const prev = searchParams.get(searchField) ?? "";
      const arr = prev?.split(",") || [];
      const removeElIndex = arr.indexOf(arrEl);
      if (removeElIndex > -1) {
        arr.splice(removeElIndex, 1);
        setValue(searchField, arr);
        searchParams.set(searchField, arr.join(","));
      }
    }
    setSearchParams(searchParams);
  };

  async function onSubmit(data) {
    if (globalState.location && globalState.location.includes("undefined")) {
      const parts = globalState.location.split(",");
      const result = parts[0].trim();
      globalState.location = result;
    }
    searchParams.set("location", globalState.location);
    searchParams.set("booking_start_time", isValidDate(data.booking_start_time) ? data.booking_start_time.toISOString() : "");
    searchParams.set("category", data.category.join(","));
    searchParams.set("price", data.price.join(","));
    searchParams.set("amenity", data.amenity.join(","));
    searchParams.set("review", data.review.join(","));
    if (data.max_capacity !== "NaN") {
      searchParams.set("max_capacity", Number(data.max_capacity));
    }
    searchParams.set("capacity",  data.capacity);
    setSearchParams(searchParams);
  }

  useEffect(() => {
    fetchSpaces();
  }, [searchParams]);

  const sortRating = (a, b) => {
    if (sortAsc == 1) {
      return (a.average_space_rating ?? 0) - (b.average_space_rating ?? 0);
    }
    return (b.average_space_rating ?? 0) - (a.average_space_rating ?? 0);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="container mx-auto mb-[24px] bg-white px-6 pt-[120px] normal-case 2xl:px-32">
        <form
          className="flex w-full flex-wrap justify-center"
          onSubmit={handleSubmit(onSubmit)}
          id="search-bar"
        >
          <CustomStaticLocationAutoCompleteV2
            // type={true}
            // control={control}
            // setValue={(val) => setValue("location", val)}
            // name="location"
            type="static"
            setValue={(val) => globalDispatch({
              type: "SETLOCATION",
              payload: {
                location:val
              },
            })}
            containerClassName={"mb-4 flex min-h-[45px] w-full max-w-full flex-grow items-center gap-2 border-2 px-4 lg:mb-0 lg:w-[unset] lg:border-r-0 lg:border-b-2"}
            className="border-0 focus:outline-none"
            placeholder="Search by city or zip code"
            suggestionType={["(regions)"]}
          />

          <div className="relative mb-6 flex h-[45px] w-full lg:w-1/2 cursor-pointer items-center gap-2 border-2 lg:border-r-0 p-2 lg:mb-0 lg:w-[unset] lg:min-w-[230px]">
            <DatePickerV3
              reset={() => resetField("booking_start_time")}
              setValue={(val) => setValue("booking_start_time", val)}
              control={control}
              name="booking_start_time"
              labelClassName="justify-between flex-grow flex-row-reverse"
              placeholder="Select Date"
              min={new Date()}
            />
          </div>
          {/* <div className="flex h-[45px] w-1/2 items-center gap-2 border-2 px-4 lg:w-[unset] lg:border-r-0">
            <PeopleIcon />
            <input
              type="number"
              placeholder="2 People (Max Capacity)"
              className="remove-arrow w-full focus:outline-none"
              {...register("max_capacity")}
            />
          </div> */}
          <button
            className="login-btn-gradient mb-4 w-full whitespace-nowrap p-2 px-6 text-white disabled:text-[#98A2B3] lg:mb-0 lg:w-[unset]"
            type="submit"
            id="update-search"
          >
            Update Search
          </button>
        </form>
        <div className="block lg:hidden">
          <button
            type="button"
            className="mb-6 flex w-full items-center justify-center gap-2 border-2 py-2 text-center"
            onClick={() => setFilterPopup(true)}
          >
            <FilterIcon />
            Filters
          </button>
          <div className="snap-scroll flex gap-4">
            {Object.entries(parseSearchParams(searchParams)).map(([k, v]) => {
              if (!v) return null;
              if (k == "booking_start_time") {
                return (
                  <span className="whitespace-nowrap rounded-[50px] bg-[#F2F4F7] py-[6px] px-[16px] text-[#475467]">
                    {formatDate(v)}
                    <button
                      type="button"
                      className="ml-3"
                      onClick={() => removeFilter(k)}
                    >
                      &#x2715;
                    </button>
                  </span>
                );
              }
              if (k == "max_capacity" && v == 0) {
                return;
              }
              let vArr = v.split(",");
              if (vArr.length > 0) {
                return vArr.map((filter, i) => (
                  <span
                    key={i}
                    className="whitespace-nowrap rounded-[50px] bg-[#F2F4F7] py-[6px] px-[16px] text-[#475467]"
                  >
                    {filter}
                    <button
                      type="button"
                      className="ml-3"
                      onClick={() => removeFilter(k, filter)}
                    >
                      &#x2715;
                    </button>
                  </span>
                ));
              }

              return (
                <span
                  key={k}
                  className="whitespace-nowrap rounded-[50px] bg-[#F2F4F7] py-[6px] px-[16px] text-[#475467]"
                >
                  {v}
                  <button
                    type="button"
                    className="ml-3"
                    onClick={() => removeFilter(k)}
                  >
                    &#x2715;
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </section>
      <section className="search-page-container container mx-auto flex gap-[32px] bg-white px-6 normal-case 2xl:px-32">
        <aside
          className={`hidden xl:block xl:w-1/5 ${filterPopup ? "popup-tablet" : ""}`}
          onClick={() => setFilterPopup(false)}
        >
          <div
            className={`${filterPopup ? "w-[80%] max-w-[500px] rounded-xl p-5" : ""} flex flex-col bg-white `}
            onClick={(e) => e.stopPropagation()}
          >
            {filterPopup ? (
              <div className="mb-[18px] flex items-center justify-between border-b pb-2">
                <h3 className="text-2xl font-semibold">Filters</h3>
                <button
                  onClick={() => setFilterPopup(false)}
                  className="rounded-full border p-1 px-3 text-2xl font-normal duration-300 hover:bg-gray-200"
                >
                  &#x2715;
                </button>
              </div>
            ) : null}

            <div className={`${filterPopup ? "snap-scroll h-[60vh]" : ""}`}>
              <FilterCheckBoxesV2
                control={control}
                name="category"
                title="Spaces"
                labelField="category"
                valueField="category"
                options={spaceCategories}
                reset={() => { resetField("category"); searchParams.set("category", ""); setSearchParams(searchParams) }}
              />
              <FilterCheckBoxesV2
                control={control}
                name="price"
                title="Prices"
                labelField="name"
                valueField="name"
                options={prices}
                reset={() => { resetField("price"); searchParams.set("price", ""); setSearchParams(searchParams) }}
              />
              <FilterCheckBoxesV2
                control={control}
                name="capacity"
                title="Capacity"
                labelField="name"
                valueField="name"
                options={capacity}
                reset={() => { resetField("capacity"); searchParams.set("capacity", ""); setSearchParams(searchParams) }}
              />
              <FilterCheckBoxesV2
                name="amenity"
                control={control}
                title="Amenities"
                options={amenityCategories}
                labelField="name"
                valueField="name"
                reset={() => { resetField("amenity"); searchParams.set("amenity", ""); setSearchParams(searchParams) }}
              />
              <FilterCheckBoxesV2
                name="review"
                control={control}
                title="Reviews"
                options={reviews}
                labelField="name"
                valueField="name"
                reset={() => { resetField("review"); searchParams.set("review", ""); setSearchParams(searchParams) }}
              />
            </div>
          </div>
        </aside>
        <div className="mb-16 max-w-full flex-grow xl:w-4/5">
          <div className="mb-[15px] flex items-center justify-between">
            <h5 className={propertySpaces.length == 0 ? "md:invisible" : ""}>
              {propertySpaces.length == 0 ? (
                "No results Found"
              ) : (
                <>
                  {" "}
                  Results Found <strong className="font-semibold">({propertySpaces.length})</strong>
                </>
              )}
            </h5>
            <CustomSelect
              options={[
                { label: "Rating (High to Low)", value: 0 },
                { label: "Rating (Low to High)", value: 1 },
              ]}
              onChange={setSortAsc}
              accessor="label"
              valueAccessor="value"
              className="min-w-[200px]"
              listOptionClassName={"pl-4"}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-6 lg:block">
            {propertySpaces.length == 0 && (
              <div className="hidden min-h-[300px] items-center justify-center normal-case text-[#667085] md:flex">
                <h2 className="flex gap-3">
                  <NoteIcon /> No results found
                </h2>
              </div>
            )}
            {propertySpaces.sort(sortRating).map((sp) => (
              <PropertySpaceTile
                key={sp.id}
                data={sp}
                forceRender={forceRender}
              />
            ))}
          </div>
        </div>
      </section>
      <Tooltip
        anchorId="update-search"
        place="right"
        content={"Search"}
        noArrow
      />
    </div>
  );
};

export default SearchPage;
