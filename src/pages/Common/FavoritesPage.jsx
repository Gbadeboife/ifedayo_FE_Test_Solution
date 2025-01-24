import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import PropertySpaceCard from "@/components/frontend/PropertySpaceCard";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import CustomSelectV2 from "@/components/CustomSelectV2";
import CustomLocationAutoCompleteV2 from "@/components/CustomLocationAutoCompleteV2";
import DatePickerV3 from "@/components/DatePickerV3";
import { isValidDate, parseSearchParams } from "@/utils/utils";
import { DRAFT_STATUS, SPACE_STATUS, SPACE_VISIBILITY } from "@/utils/constants";
import MkdSDK from "@/utils/MkdSDK";
import { useSearchParams } from "react-router-dom";
import PropertySpaceFiltersModal from "@/components/PropertySpaceFiltersModal";
import { AuthContext, tokenExpireError } from "@/authContext";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";

const sdk = new MkdSDK();
const ctrl = new AbortController();
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

const FavoritesPage = () => {
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  const [propertySpaces, setPropertySpaces] = useState(Array(4).fill({}));
  const [showFilter, setShowFilter] = useState(false);
  const [forceRender, setForceRender] = useState(new Date());
  const [searchParams, setSearchParams] = useSearchParams();

  const { handleSubmit, register, watch, setValue, control, formState, resetField } = useForm({
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

  const direction = watch("direction");
  const fromDate = watch("from");

  async function fetchPropertySpaces() {
    setPropertySpaces(Array(4).fill({}));
    const data = parseSearchParams(searchParams);
    const user_id = localStorage.getItem("user");

    var from_price, to_price;
    if (data.price_range) {
      var arr = data.price_range.split("-");
      if (arr.length > 1) {
        from_price = arr[0].trim().slice(1);
        to_price = arr[1].trim().slice(1);
      }
    }

    let where = [
      `ergo_property_spaces.space_status = ${SPACE_STATUS.APPROVED} AND ergo_property_spaces.draft_status = ${DRAFT_STATUS.COMPLETED} AND ergo_property_spaces.availability = ${SPACE_VISIBILITY.VISIBLE} AND ergo_user_property_spaces.user_id = ${user_id} AND ergo_property_spaces.deleted_at IS NULL`,
    ];

    if (data.category) {
      where.push(`ergo_spaces.category = '${data.category}'`);
    }

    if (data.space_name) {
      where.push(`ergo_property.name LIKE '%${data.space_name}%'`);
    }

    if (data.price_range) {
      where.push(`ergo_property_spaces.rate BETWEEN ${from_price} AND ${to_price}`);
    }

    if (data.location) {
      where.push(
        `(ergo_property.address_line_1 LIKE '%${data.location}%' OR ergo_property.address_line_2 LIKE '%${data.location}%' OR ergo_property.city LIKE '%${data.location}%' OR ergo_property.country LIKE '%${data.location}%' OR ergo_property.zip LIKE '%${data.location}%' OR ergo_property.name LIKE '%${data.location}%')`,
      );
    }

    console.log("favorites where ", where);

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/popular/PAGINATE",
        {
          page: 1,
          limit: 10000,
          user_id: Number(user_id),
          where,
          booking_start_time: isValidDate(data.from || "") ? new Date(data.from).toISOString() : undefined,
          booking_end_time: isValidDate(data.to || "") ? new Date(data.to).toISOString() : undefined,
          sortId: direction == "NONE" ? undefined : "id",
          direction: direction == "NONE" ? undefined : direction,
        },
        "POST",
        ctrl.signal,
      );
      if (Array.isArray(result.list)) {
        setPropertySpaces(result.list);
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
    fetchPropertySpaces();
  }, [searchParams, forceRender]);

  const onSubmit = async (data) => {
    if (window.innerWidth < 700) {
      setShowFilter(false);
    }
    console.log("submitting ", data);
    searchParams.set("category", data.category);
    searchParams.set("price_range", data.price_range);
    searchParams.set("space_name", data.space_name);
    searchParams.set("location", data.location);
    searchParams.set("from", dirtyFields?.from ? data.from.toISOString() : "");
    searchParams.set("to", dirtyFields?.to ? data.to.toISOString() : "");
    setSearchParams(searchParams);
  };

  const sortByDate = (a, b) => {
    if (direction == "DESC") {
      return new Date(b.id) - new Date(a.id);
    }
    return new Date(a.id) - new Date(b.id);
  };

  return (
    <>
      <section className="container mx-auto min-h-screen bg-white px-6 pt-[120px] normal-case 2xl:px-16">
        <h1 className="mb-[40px] text-3xl font-semibold md:text-4xl">My Favorite spaces</h1>
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
              <CustomSelectV2
                items={[{ label: "All Categories", value: "" }, ...globalState.spaceCategories.map((sp) => ({ label: sp.category, value: sp.category }))]}
                labelField="label"
                valueField="value"
                containerClassName="flex-grow max-w-xs min-w-[10rem]"
                className={`w-full border py-2 px-3`}
                placeholder={"All Categories"}
                control={control}
                name="category"
              />
              <CustomSelectV2
                items={prices}
                labelField="label"
                valueField="value"
                containerClassName="flex-grow max-w-xs min-w-[10rem]"
                className={`w-full border py-2 px-3`}
                placeholder={"All Prices"}
                control={control}
                name="price_range"
              />
              <CustomLocationAutoCompleteV2
                control={control}
                setValue={(val) => setValue("location", val, { shouldDirty: true })}
                name="location"
                className={`rounded border py-3 px-3 leading-tight text-gray-700 focus:outline-none`}
                containerClassName={"w-[unset] flex-grow max-w-xs"}
                placeholder="Location"
                hideIcons
              />
              <div className="z-10 flex min-w-[190px] items-center gap-2 rounded-md border bg-white px-2">
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
                placeholder="Space name"
                className="max-w-[180px] rounded-md border p-2 focus:outline-none active:outline-none"
                {...register("space_name")}
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
        <div className="property-space-grid pb-[100px]">
          {propertySpaces.sort(sortByDate).map((property, idx) => (
            <PropertySpaceCard
              key={property.id ?? idx}
              data={property}
              forceRender={setForceRender}
            />
          ))}
          {propertySpaces.length < 4 ? (
            <>
              <div className="hidden 2xl:block"></div>
              <div className="hidden lg:block"></div>
              <div className="hidden md:block"></div>
            </>
          ) : null}
        </div>
      </section>
      <PropertySpaceFiltersModal
        modalOpen={showFilter}
        closeModal={() => setShowFilter(false)}
      />
    </>
  );
};

export default FavoritesPage;
