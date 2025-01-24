import React, { useEffect, useState } from "react";
import PropertySpaceCard from "@/components/frontend/PropertySpaceCard";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import NoteIcon from "@/components/frontend/icons/NoteIcon";
import { isValidDate, parseSearchParams } from "@/utils/utils";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import HostCardSlider from "@/components/frontend/HostCardSlider";
import CustomSelectV2 from "@/components/CustomSelectV2";
import CustomLocationAutoCompleteV2 from "@/components/CustomLocationAutoCompleteV2";
import DatePickerV3 from "@/components/DatePickerV3";
import { DRAFT_STATUS, SPACE_STATUS, SPACE_VISIBILITY } from "@/utils/constants";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import PropertySpaceFiltersModal from "@/components/PropertySpaceFiltersModal";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";

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

const sdk = new MkdSDK();

const ExplorePage = () => {
  const FETCH_PER_SCROLL = 12;
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get("section") ?? "all";
  const [hosts, setHosts] = useState([]);
  const [popularSpaces, setPopularSpaces] = useState([]);
  const [newSpaces, setNewSpaces] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [forceRender, setForceRender] = useState("");
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  const [ctrl] = useState(new AbortController());

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

  const direction = watch("direction");
  const fromDate = watch("from");

  const [popularTotal, setPopularTotal] = useState(10000);
  const [newSpaceTotal, setNewSpaceTotal] = useState(10000);

  async function fetchPopularSpaces(page) {
    setPopularSpaces([]);
    setPopularSpaces((prev) => {
      const amountToFetch = popularTotal - prev.length > FETCH_PER_SCROLL ? FETCH_PER_SCROLL : Math.abs(popularTotal - prev.length - FETCH_PER_SCROLL);
      return [...prev, ...Array(amountToFetch).fill({})];
    });
    const data = parseSearchParams(searchParams);
    const user_id = localStorage.getItem("user");
    const location = (data.location?.split(","))

    var from_price, to_price;
    if (data.price_range) {
      var arr = data.price_range.split("-");
      if (arr.length > 1) {
        from_price = arr[0].trim().slice(1);
        to_price = arr[1].trim().slice(1);
      }
    }

    let where = [
      `ergo_property_spaces.space_status = ${SPACE_STATUS.APPROVED} AND ergo_property_spaces_images.is_approved = 1 AND schedule_template_id IS NOT NULL AND ergo_property_spaces.draft_status = ${DRAFT_STATUS.COMPLETED} AND ergo_property_spaces.deleted_at IS NULL`,
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
        `(ergo_property.address_line_1 LIKE '%${data.location}%' OR ergo_property.address_line_2 LIKE '%${data.location}%' OR ergo_property.city LIKE '%${location[0]}%' OR ergo_property.country LIKE '%${location.length === 1 ? location[0] : location.length === 2 ? location[1] : location[2]}%' OR ergo_property.zip LIKE '%${data.location}%' OR ergo_property.name LIKE '%${data.location}%')`,
      );
    }

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/popular/PAGINATE",
        {
          page: page ?? 1,
          limit: FETCH_PER_SCROLL,
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
        setPopularSpaces((prev) => {
          return [...prev.filter((item) => Object.keys(item).length > 0), ...result.list].filter((v, i, a) => a.findIndex((v2) => v2.id === v.id) === i);
        });
        setPopularTotal(result.total);
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

  async function fetchNewSpaces(page) {
    setNewSpaces([]);
    setNewSpaces((prev) => {
      const amountToFetch = newSpaceTotal - prev.length > FETCH_PER_SCROLL ? FETCH_PER_SCROLL : Math.abs(newSpaceTotal - prev.length - FETCH_PER_SCROLL);
      return [...prev, ...Array(amountToFetch).fill({})];
    });
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
      `ergo_property_spaces.space_status = ${SPACE_STATUS.APPROVED} AND ergo_property_spaces.draft_status = ${DRAFT_STATUS.COMPLETED} AND ergo_property_spaces.availability = ${SPACE_VISIBILITY.VISIBLE} AND ergo_property_spaces_images.is_approved = 1`,
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
        `(ergo_property.address_line_1 LIKE '%${location}%' OR ergo_property.address_line_2 LIKE '%${location}%' OR ergo_property.city LIKE '%${location[0] ?? ""}%' OR ergo_property.country LIKE '%${location.length === 1 ? location[0] : location.length === 2 ? location[1] : location[2]}%' OR ergo_property.zip LIKE '%${location}%' OR ergo_property.name LIKE '%${location}%')`,
      );
    }

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/popular/PAGINATE",
        {
          page: page ?? 1,
          limit: FETCH_PER_SCROLL,
          user_id: Number(user_id),
          where,
          sortId: "update_at",
          direction: "DESC",
          booking_start_time: isValidDate(data.from || "") ? new Date(data.from).toISOString() : undefined,
          booking_end_time: isValidDate(data.to || "") ? new Date(data.to).toISOString() : undefined,
        },
        "POST",
        ctrl.signal,
      );
      if (Array.isArray(result.list)) {
        setNewSpaces((prev) => {
          return [...prev.filter((item) => Object.keys(item).length > 0), ...result.list].filter((v, i, a) => a.findIndex((v2) => v2.id === v.id) === i);
        });
        setNewSpaceTotal(result.total);
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

  async function fetchHosts() {
    const filter = parseSearchParams(searchParams);
    const data = parseSearchParams(searchParams);
    const location = (data.location?.replace(', undefined', '')?.split(","))

    const user_id = localStorage.getItem("user");

    var from_price, to_price;
    if (data.price_range) {
      var arr = data.price_range.split("-");
      if (arr.length > 1) {
        from_price = arr[0].trim().slice(1);
        to_price = arr[1].trim().slice(1);
      }
    }

    let where = [];
    where.push('ergo_property.id IS NOT NULL');
    if (data.category) {
      where.push(`ergo_spaces.category = '${data.category}'`);
    }

    if (data.space_name) {
      where.push(`ergo_property.name LIKE '%${data.space_name}%'`);
    }
    if (data.from) {
      where.push(`ergo_user.create_at BETWEEN '${data.from}' AND '${data.to}'`);
    }
    if (data.price_range) {
      where.push(`ergo_property_spaces.rate BETWEEN ${from_price} AND ${to_price}`);
    }
    if (data.location) {
      where.push([
        `(ergo_profile.address_line_1 LIKE '%${data.location}%' OR ergo_profile.address_line_2 LIKE '%${data.location}%' OR ergo_profile.city LIKE '%${location[0]}%' OR ergo_profile.country LIKE '%${location[1]}%' OR ergo_profile.zip LIKE '%${data.location}%')`,
      ]);
    }

    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/top-hosts/PAGINATE",
        {
          page: 1,
          limit: 1000,
          sortId: "avg_host_rating",
          direction: "DESC",
          where,
          booking_start_time: isValidDate(data.from || "") ? new Date(data.from).toISOString() : undefined,
          booking_end_time: isValidDate(data.to || "") ? new Date(data.to).toISOString() : undefined,
        }, "POST", ctrl.signal);
      setHosts(result.list);
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
    switch (searchParams.get("section")) {
      case "popular":
        fetchPopularSpaces();
        break;
      case "hosts":
        fetchHosts();
        break;
      case "new-spaces":
        fetchNewSpaces();
        break;
      default:
        fetchHosts();
        fetchPopularSpaces();
        fetchNewSpaces();
    }
  }, [searchParams]);

  useEffect(() => {
    if (forceRender) {
      setPopularSpaces([]);
      setNewSpaces([]);
      fetchPopularSpaces();
      fetchNewSpaces();
    }
  }, [forceRender]);

  useEffect(() => {
    return () => {
      // TODO: abort this only when component unmounts
      // console.log("aborting");
      // ctrl.abort();
    };
  }, []);

  const onSubmit = async (data) => {
    if (window.innerWidth < 700) {
      setShowFilter(false);
    }

    if (data.location.includes("undefined")) {
      const parts = inputString.split(",");
      const result = parts[0].trim();
      data.location = result;
    }
    searchParams.set("category", data.category);
    searchParams.set("price_range", data.price_range);
    searchParams.set("space_name", data.space_name);
    searchParams.set("location", data.location);
    searchParams.set("from", dirtyFields?.from ? data.from.toISOString() : "");
    searchParams.set("to", dirtyFields?.to ? data.to.toISOString() : "");
    setSearchParams(searchParams);
  };

  const sortByDate = (a, b) => {
    if (direction == "NONE") return 0;
    if (direction == "DESC") {
      return new Date(b.id) - new Date(a.id);
    }
    return new Date(a.id) - new Date(b.id);
  };

  return (
    <div className="min-h-screen">
      <section className="container mx-auto bg-white px-6 pt-[120px] normal-case 2xl:px-16">
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
            {/* <CustomLocationAutoCompleteV2
              control={control}
              setValue={(val) => setValue("location", val)}
              name="location"
              className={`rounded border py-3 px-3 leading-tight text-gray-700 focus:outline-none`}
              containerClassName={"w-[unset] flex-gro max-w-xs"}
              placeholder="Location"
              suggestionType={["(regions)"]}
              hideIcons
            /> */}
            <CustomLocationAutoCompleteV2
              control={control}
              setValue={(val) => setValue("location", val)}
              name="location"
              className={`rounded border py-3 px-3 leading-tight text-gray-700 focus:outline-none`}
              containerClassName={"w-[unset] flex-gro max-w-xs"}
              placeholder="Location"
              suggestionType={["(regions)"]}
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
      {(section == "popular" || section == "all") && (
        <section
          className="container mx-auto pt-[40px] 2xl:px-16"
          id="popular"
        >
          <div className="mb-[26px] flex items-end justify-between border-b border-gray-300 px-6 pb-[12px] md:px-0">
            <h3 className="text-3xl font-bold">{searchParams.get("category") || "Popular" + " spaces"}</h3>
          </div>
          {popularSpaces.length == 0 && (
            <div className="flex min-h-[300px] items-center justify-center normal-case text-[#667085]">
              <h2 className="flex gap-3">
                <NoteIcon /> No spaces found
              </h2>
            </div>
          )}
          <InfiniteScroll
            dataLength={popularSpaces.length}
            next={() => {
              fetchPopularSpaces(Math.round(popularSpaces.length / FETCH_PER_SCROLL + 1));
            }}
            scrollThreshold={1}
            hasMore={popularSpaces.length < popularTotal}
            loader={<></>}
            endMessage={
              <p className="text-center normal-case">
                <b></b>
              </p>
            }
          >
            {
              <div className="property-space-grid pb-[100px]">
                {popularSpaces.sort(sortByDate).map((property, idx) => (
                  <PropertySpaceCard
                    key={property.id ?? idx}
                    data={property}
                    forceRender={setForceRender}
                  />
                ))}
                {popularSpaces.length < 4 ? (
                  <>
                    <div className="hidden 2xl:block"></div>
                    <div className="hidden lg:block"></div>
                    <div className="hidden md:block"></div>
                  </>
                ) : null}
              </div>
            }
          </InfiniteScroll>
        </section>
      )}
      {section == "all" && (
        <section className="container mx-auto flex flex-wrap pt-[40px] pb-[40px] md:pb-[140px] 2xl:px-16">
          <div className="px-6 md:w-2/5 md:px-0">
            <h3 className="mb-[70px] text-[30px] font-semibold md:text-center">Browse By Category</h3>
          </div>
          <div className="browse-grid md:w-3/5">
            {globalState.spaceCategories.map((tab, idx) => (
              <button
                key={tab.id}
                className={``}
                onClick={() => {
                  setPopularSpaces(Array(FETCH_PER_SCROLL).fill({}));
                  reset();
                  window.scrollTo({ top: 0, left: 0 });
                  searchParams.set("category", tab.category);
                  searchParams.set("section", "popular");
                  searchParams.delete("price_range");
                  searchParams.delete("space_name");
                  setSearchParams(searchParams);
                }}
              >
                <img
                  src={tab.image}
                  alt={tab.category}
                  className="h-24 w-full rounded-lg object-cover md:h-40"
                />
                <p className="text-lg py-3 px-5 text-left font-semibold">{tab.category}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {(section == "hosts" || section == "all") && (
        <section
          className="container mx-auto pt-[12px] pb-[64px] 2xl:px-16"
          id="hosts"
        >
          <div className="mb-[26px] flex items-end justify-between border-b border-gray-300 px-6 pb-[12px] md:px-0">
            <h3 className="text-3xl font-bold">Top rated hosts</h3>
          </div>
          <div className="px-2 md:px-0">
            <HostCardSlider hosts={hosts} />
          </div>
        </section>
      )}
      {(section == "new-spaces" || section == "all") && (
        <section
          className="container mx-auto pt-[40px] 2xl:px-16"
          id="new-spaces"
        >
          <div className="mb-[26px] flex items-end justify-between border-b border-gray-300 px-6 pb-[12px] md:px-0">
            <h3 className="text-3xl font-bold">New Spaces</h3>
          </div>
          {newSpaces.length == 0 && (
            <div className="flex min-h-[300px] items-center justify-center normal-case text-[#667085]">
              <h2 className="flex gap-3">
                <NoteIcon /> No spaces found
              </h2>
            </div>
          )}
          <InfiniteScroll
            dataLength={newSpaces.length}
            next={() => {
              fetchNewSpaces(Math.round(newSpaces.length / FETCH_PER_SCROLL + 1));
            }}
            scrollThreshold={1}
            hasMore={newSpaces.length < newSpaceTotal}
            loader={<></>}
            endMessage={
              <p className="text-center normal-case">
                <b></b>
              </p>
            }
          >
            {
              <div className="property-space-grid pb-[100px]">
                {newSpaces.sort(sortByDate).map((property, idx) => (
                  <PropertySpaceCard
                    key={property.id ?? idx}
                    data={property}
                    forceRender={setForceRender}
                  />
                ))}
                {newSpaces.length < 4 ? (
                  <>
                    <div className="hidden 2xl:block"></div>
                    <div className="hidden lg:block"></div>
                    <div className="hidden md:block"></div>
                  </>
                ) : null}
              </div>
            }
          </InfiniteScroll>
        </section>
      )}
      <PropertySpaceFiltersModal
        modalOpen={showFilter}
        closeModal={() => setShowFilter(false)}
      />
    </div>
  );
};

export default ExplorePage;
