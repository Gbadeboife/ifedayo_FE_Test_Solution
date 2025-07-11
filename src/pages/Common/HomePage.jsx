import React, { useContext, useEffect, useState } from "react";
import { createSearchParams, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import PropertySpaceCard from "@/components/frontend/PropertySpaceCard";
import { callCustomAPI } from "@/utils/callCustomAPI";
import PeopleIcon from "@/components/frontend/icons/PeopleIcon";
import TrustedIcon from "@/components/frontend/icons/TrustedIcon";
import FlexibleIcon from "@/components/frontend/icons/FlexibleIcon";
import InfiniteScroll from "react-infinite-scroll-component";
import SearchIcon from "@/components/frontend/icons/SearchIcon";
import { GlobalContext, showToast } from "@/globalContext";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import HostCardSlider from "@/components/frontend/HostCardSlider";
import { AuthContext, tokenExpireError } from "@/authContext";
import useUserCurrentLocation from "@/hooks/api/useUserCurrentLocation";
import { DRAFT_STATUS } from "@/utils/constants";
import { useForm } from "react-hook-form";
import CustomLocationAutoCompleteV2 from "@/components/CustomLocationAutoCompleteV2";
import DatePickerV3 from "@/components/DatePickerV3";
import CustomSelectV2 from "@/components/CustomSelectV2";
import MkdSDK from "@/utils/MkdSDK";
import CustomStaticLocationAutoCompleteV2 from "@/components/CustomStaticLocationAutoCompleteV2";

const sdk = new MkdSDK();
const ctrl = new AbortController();

const HomePage = () => {
  const FETCH_PER_SCROLL = 12;
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { state } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("category") || "all");
  const [hosts, setHosts] = useState(Array(5).fill({}));
  const [popularSpaces, setPopularSpaces] = useState([]);
  const [newSpaces, setNewSpaces] = useState([]);
  const [forceRender, setForceRender] = useState("");
  const location = useLocation()
  const { state: authState, dispatch: authDispatch } = useContext(AuthContext);

  const { dispatch } = useContext(AuthContext);
  const [popularTotal, setPopularTotal] = useState(1000);
  const [newTotal, setNewTotal] = useState(1000);
  const spaceCategories = globalState.spaceCategories;

  const { handleSubmit, control, setValue, resetField, formState, register } = useForm({
    defaultValues: {
      booking_start_time: new Date(),
      location: globalState.location,
      size: "",
    },
  });

  const { touchedFields } = formState;

  const { city, country, done: currentLocationChecked } = useUserCurrentLocation();
  const [noCurrentLocationData, setNoCurrentLocationData] = useState(false);

  const navigate = useNavigate();
  const userRole = localStorage.getItem("role");
  const isLoggedIn = !!localStorage.getItem("token");

  async function fetchPopularSpaces(page) {
    // only add empty spaces if there's no empty card i.e we are not currently fetching
    if (popularSpaces.every((space) => Object.keys(space).length > 0)) {
      setPopularSpaces((prev) => {
        const amountToFetch = popularTotal - prev.length > FETCH_PER_SCROLL ? FETCH_PER_SCROLL : Math.abs(popularTotal - prev.length - FETCH_PER_SCROLL);
        return [...prev, ...Array(amountToFetch).fill({})];
      });
    }
    const user_id = localStorage.getItem("user");
    const where = [
      `${activeTab != "all" ? `ergo_spaces.category LIKE '%${activeTab}%'` : "1"} AND ergo_property_spaces.space_status = 1 AND ergo_property_spaces.draft_status = ${DRAFT_STATUS.COMPLETED
      } AND ergo_property_spaces_images.is_approved = 1 AND ergo_property_spaces.deleted_at IS NULL AND schedule_template_id IS NOT NULL AND (${city && !noCurrentLocationData ? `ergo_property.city LIKE '%${city}%'` : "1"} OR ${country && !noCurrentLocationData ? `ergo_property.country LIKE '%${country}%'` : "1"
      })`,
    ];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/popular/PAGINATE", { page: page ?? 1, limit: FETCH_PER_SCROLL, user_id: Number(user_id), where }, "POST", ctrl.signal);
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
    if (newSpaces.every((space) => Object.keys(space).length > 0)) {
      setNewSpaces((prev) => {
        const amountToFetch = newTotal - prev.length > FETCH_PER_SCROLL ? FETCH_PER_SCROLL : Math.abs(newTotal - prev.length - FETCH_PER_SCROLL);
        return [...prev, ...Array(amountToFetch).fill({})];
      });
    }
    const user_id = localStorage.getItem("user");
    const where = [
      `${activeTab != "all" ? `ergo_spaces.category LIKE '%${activeTab}%'` : "1"} AND ergo_property_spaces.space_status = 1 AND ergo_property_spaces.draft_status = ${DRAFT_STATUS.COMPLETED
      } AND ergo_property_spaces_images.is_approved = 1 AND schedule_template_id IS NOT NULL AND ergo_property_spaces.deleted_at IS NULL AND (${city && !noCurrentLocationData ? `ergo_property.city LIKE '%${city}%'` : "1"} OR ${country && !noCurrentLocationData ? `ergo_property.country LIKE '%${country}%'` : "1"
      })`,
    ];
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/popular/PAGINATE",
        { page: page ?? 1, limit: 6, user_id: Number(user_id), where, sortId: "update_at", direction: "DESC" },
        // { page: page ?? 1, limit: FETCH_PER_SCROLL, user_id: null, where, sortId: "update_at", direction: "DESC" },
        "POST",
        ctrl?.signal,
      );
      if (Array.isArray(result.list)) {
        setNewSpaces((prev) => {
          return [...prev.filter((item) => Object.keys(item).length > 0), ...result.list].filter((v, i, a) => a.findIndex((v2) => v2.id === v.id) === i);
        });
        setNewTotal(result.total);
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
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/top-hosts/PAGINATE",
        {
          page: 1,
          limit: 10,
          sortId: "avg_host_rating",
          direction: "DESC",
          where: [
            `${city && !noCurrentLocationData ? `ergo_profile.city LIKE '%${city}%'` : "1"} AND ${country && !noCurrentLocationData ? `ergo_profile.country LIKE '%${country}%'` : "1"}`,
            "ergo_user.deleted_at IS NULL", "ergo_property.id IS NOT NULL",
          ],
        },
        "POST",
        ctrl.signal,
      );

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

  function onSubmit(data) {
    navigate({
      pathname: "/search",
      search: createSearchParams({
        location: globalState.location ?? "",
        booking_start_time: touchedFields.booking_start_time ? data.booking_start_time.toISOString() : "",
        max_capacity: data.max_capacity ?? "",
        capacity: data.capacity ?? "",
        size: data.size ?? "",
      }).toString(),
    });
  }

  async function setDevice() {
    if (!localStorage.getItem("token") || localStorage.getItem("token") !== undefined) {
      return;
    }
    try {
      await sdk.setUUId()
    } catch (error) {
      console.log(error.message)
    }
  }

  useEffect(() => {
    let setter;
    if (!setter) {
      setDevice()
    }
    return () => {
      setter = true
    }
  }, [])

  useEffect(() => {
    if (!currentLocationChecked) return;
    if (!noCurrentLocationData) {
      globalDispatch({
        type: "SETLOCATION",
        payload: {
          location:(city ?? "") + (city && country ? ", " : "") + (country ?? "")
        },
      })
      setValue("location", (city ?? "") + (city && country ? ", " : "") + (country ?? ""));
    }
    fetchHosts();
  }, [currentLocationChecked, noCurrentLocationData]);

  useEffect(() => {
    if (!currentLocationChecked) return;
    setPopularSpaces([]);
    setNewSpaces([]);
    fetchPopularSpaces();
    fetchNewSpaces();
  }, [activeTab, currentLocationChecked, noCurrentLocationData]);

  useEffect(() => {
    if (forceRender && currentLocationChecked) {
      setPopularSpaces([]);
      setNewSpaces([]);
      fetchPopularSpaces();
      fetchNewSpaces();
    }
  }, [forceRender]);

  function switchToCustomer() {
    authDispatch({ type: "SWITCH_TO_CUSTOMER" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as a customer`,
        btn: "Ok got it",
      },
    });
    navigate("/signup")
  }

  return (
    <>
      <section
        style={{
          height: 600,
          background: `url('${spaceCategories.find((cat) => activeTab == cat.category)?.image ?? "/jumbotron1.jpg"}'), linear-gradient(0deg, rgba(16, 24, 40, 0.79), rgba(16, 24, 40, 0.79))`,
        }}
        className="my-background-image mb-6 pt-[70px] md:rounded-b-[3rem]"
      >
        <nav className="mb-[60px] flex justify-center border-t border-b border-gray-500 text-sm text-gray-300 md:mb-[103px] md:text-base">
          <div className="horizontal-scroll-categories">
            <button
              key={0}
              className={`${activeTab == "all" ? "active text-white" : ""} flex w-[105px] items-center justify-center whitespace-nowrap py-[12px]`}
              onClick={() => {
                setActiveTab("all");
                searchParams.set("category", "all");
                setSearchParams(searchParams);
              }}
            >
              All Spaces
            </button>
            {spaceCategories.map((tab) => {
              return (
                <button
                  key={tab.id}
                  className={`${activeTab == tab.category ? "active text-white" : ""} flex w-[105px] items-center justify-center whitespace-nowrap py-[12px]`}
                  onClick={() => {
                    setActiveTab(tab.category);
                    searchParams.set("category", tab.category);
                    // searchParams.set("section", "popular");
                    setSearchParams(searchParams);
                    // navigate(`/explore?category=${tab.category}&section=popular`)
                  }}
                >
                  {tab.category}
                </button>
              );
            })}
            <div className="mover"></div>
          </div>
        </nav>
        <h1 className="mb-[30px] px-4 text-center text-5xl font-bold text-white md:text-6xl lg:text-7xl">Spaces tailored to your needs</h1>
        <form
          className="flex flex-wrap justify-center px-6 text-sm fourteenth-step md:px-24 md:text-base lg:flex-nowrap"
          id="search-bar"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <CustomStaticLocationAutoCompleteV2
            setValue={(val) => globalDispatch({
              type: "SETLOCATION",
              payload: {
                location:val
              },
            })}
            type="static"
            containerClassName={"flex h-[40px] w-full items-center gap-2 rounded-t-md border-2 border-r-0 bg-white px-4 py-2 md:h-[unset] lg:max-w-[331px] lg:rounded-none lg:py-0"}
            className="border-0 focus:outline-none"
            placeholder="Search by city or zip code"
            onClear={() => setNoCurrentLocationData(true)}
            suggestionType={["(regions)"]}
          />
          <div className="flex min-h-[40px] w-1/2 items-center gap-2 rounded-bl-md border-l-2 bg-white px-2 lg:min-w-[230px] lg:max-w-[230px] lg:rounded-none">
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
          <div className="flex w-1/2 items-center gap-2 rounded-br-md border-l bg-white px-2 lg:max-w-[174px] lg:rounded-none lg:border-2">
            <PeopleIcon />
            <input
              type="number"
              placeholder={activeTab == "Parking" ? "Number of spaces" : "2 People"}
              className="w-full remove-arrow focus:outline-none"
              {...register("max_capacity")}
            />
          </div>
          {spaceCategories.find((cat) => activeTab == cat.category)?.has_sizes == 1 && (
            <div className="flex w-1/2 items-center gap-2 rounded-br-md !border-l-0 bg-white px-2 lg:max-w-[174px] lg:rounded-none lg:border-2">
              <CustomSelectV2
                items={[
                  { label: "All Sizes", value: "" },
                  { label: "Small", value: 0 },
                  { label: "Medium", value: 1 },
                  { label: "Large", value: 2 },
                  { label: "X-Large", value: 3 },
                ]}
                labelField="label"
                valueField="value"
                containerClassName="h-full flex-grow"
                placeholder={"All sizes"}
                control={control}
                name="size"
                optionsClassName={"mt-3 w-[150%] -left-1/3 -right-1/3 normal-case"}
              />
            </div>
          )}

          <button
            type="submit"
            className="login-btn-gradient login-btn-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-tr rounded-br rounded-tl rounded-bl py-3 px-6 tracking-wide text-white outline-none focus:outline-none lg:mt-0 lg:w-[unset] lg:rounded-tl-none lg:rounded-bl-none"
            id="search-button"
          >
            <SearchIcon />
            <span>Search</span>
          </button>
        </form>
      </section>

      <div className="mb-[48px] w-full">
      <h2 className="mb-[5px] px-4 text-center text-3xl font-bold normal-case md:text-4xl">Top-quality spaces and customer service</h2>
      <h5 className="mb-[8px] px-4 text-center text-md font-normal normal-case md:text-2xl">Your number one stop for renting and offering space(s) for work and leisure</h5>
      <div className="flex justify-center mx-auto mt-10 max-w-max">
      <div className="grid grid-cols-2 md:grid-cols-4 w-full items-center justify-even gap-[15px] text-xl text-gray-300 w-full">
      {spaceCategories.map((cat, idx) => (
        <div key={cat.id} className="block w-full">
             <span className="flex items-center gap-2 py-1 text-black rounded-full">
             <img src= {cat.icon} className="object-cover w-5 h-5"/>
             {cat.category}
           </span>
          </div>
          ))}
        </div>
        </div>
      </div>

      <section className="container mx-auto pt-[40px] 2xl:px-16 px-6">
        <div className="mb-[26px] flex items-center justify-between border-b border-gray-300 px-6 pb-[12px] md:px-0">
          <h3 className="text-3xl font-bold">Popular</h3>
          <Link
            to={`/explore?section=popular`}
            className="text-sm font-semibold tracking-wider my-text-gradient"
            id="view-all-popular"
          >
            VIEW ALL POPULAR
          </Link>
        </div>
        {popularSpaces.length < 1 && (
          <p className="flex min-h-[400px] items-center justify-center text-center normal-case">
            <b>No Spaces found</b>
          </p>
        )}
        <InfiniteScroll
          dataLength={popularSpaces.length}
          next={() => {
            console.log("calling next", popularSpaces.length / FETCH_PER_SCROLL + 1);
            fetchPopularSpaces(Math.round(popularSpaces.length / FETCH_PER_SCROLL + 1));
          }}
          scrollThreshold={0.5}
          hasMore={popularSpaces.length < popularTotal}
          loader={<></>}
          endMessage={<></>}
        >
          {
            <div className="property-space-grid pb-[100px]">
              {popularSpaces.slice(0, 6).map((property, idx) => (
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
      <section className="container mx-auto pb-[80px] normal-case md:pt-[40px] md:pb-[140px] 2xl:px-16 px-6">
      <div className="mb-[26px] flex items-center justify-between border-b border-gray-300 px-6 pb-[12px] md:px-0">
          <h3 className="text-3xl font-bold">Browse By Category</h3>
          <Link
            to={`/explore?category=&section=popular&price_range=&space_name=&location=&from=&to=`}
            className="text-sm font-semibold tracking-wider my-text-gradient"
            id="view-all-popular"
          >
            VIEW ALL CATEGORIES
          </Link>
        </div>

        <div className="flex flex-wrap justify-between w-full gap-4 md:browse-grid">
          {spaceCategories.slice(0,spaceCategories.length-4).map((tab, idx) => (
            <Link
              key={tab.id}
              to={`/explore?category=${tab.category}&section=popular`}
              className="rounded-[6px] border w-full flex grow flex-cols w-full md:max-w- border-[#EAECF0] bg-[#F9FAFB]"
            >
              <img
                src={tab.image}
                alt={tab.category}
                className="object-cover w-full h-24 rounded-lg md:h-40"
              />
              <p className="w-full px-5 py-3 text-lg font-semibold text-right">{tab.category}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="container mx-auto py-[64px] 2xl:px-16 px-6">
        <div className="mb-[26px] flex items-center justify-between border-b border-gray-300 px-6 pb-[12px] md:px-0">
          <h3 className="text-2xl font-bold md:text-3xl">Top rated hosts</h3>
          <Link
            to={`/explore?section=hosts`}
            className="text-sm font-semibold tracking-wider my-text-gradient md:text-base"
            id="view-all-hosts"
          >
            VIEW ALL HOSTS
          </Link>
        </div>
        <HostCardSlider hosts={hosts} />
      </section>

      <section className="container mx-auto pt-[40px] 2xl:px-16 px-6">
        <div className="mb-[26px] flex items-center justify-between border-b border-gray-300 px-6 pb-[12px] md:px-0">
          <h3 className="text-2xl font-bold md:text-3xl">New Spaces</h3>
          <Link
            to={`/explore?section=new-spaces`}
            className="text-sm font-semibold tracking-wider my-text-gradient md:text-base"
            id="view-all-new-spaces"
          >
            VIEW ALL NEW SPACES
          </Link>
        </div>
        {newSpaces.length == 0 && (
          <p className="flex min-h-[400px] items-center justify-center text-center normal-case">
            <b>No Spaces found</b>
          </p>
        )}

        <InfiniteScroll
          dataLength={newSpaces.length}
          next={() => {
            fetchNewSpaces(Math.round(newSpaces.length / FETCH_PER_SCROLL + 1));
          }}
          scrollThreshold={0.9}
          hasMore={newSpaces.length < newTotal}
          loader={<></>}
          endMessage={
            <p className="text-center normal-case">
              <b></b>
            </p>
          }
        >
          {
            <div className="property-space-grid pb-[100px]">
              {newSpaces.slice(0, 6).map((property, idx) => (
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

      {(!isLoggedIn || userRole === "customer") && (
        <section className="container items-center justify-between px-6 py-20 mx-auto mb-12 bg-gray-100 rounded-xl 2xl:px-16 md:flex md:flex-nowrap">
          <div className="w-full md:w-[25%] mt-8 md:mt-0">
            <h3 className="pb-3 text-xl font-bold leading-10 md:text-4xl">Host Your Space Today!</h3>
            <p className="my-4 text-base text-left">
              Unlock new income opportunities by listing your space on our platform. Join a community of successful hosts, reach thousands of potential guests, and maximize your property's potential.
            </p>
              <button
              onClick={() => authState.originalRole === "customer" ? navigate("/become-a-host") : navigate("/signup")}
              className="px-4 py-3 mb-4 text-sm text-white login-btn-gradient rounded-3xl">
                Start Hosting Now
              </button>
          </div>
          <div className="justify-between hidden w-full md:flex md:w-1/2">
            <img
              src="https://freepngimg.com/thumb/building/154733-building-hotel-download-hq.png"
              alt="Descriptive Alt Text"
              className="w-full md:w-[70%] h-auto rounded-lg object-cover"
            />
          </div>
        </section>
      )}

      <Tooltip
        anchorId="search-button"
        place="right"
        content="Search"
        noArrow
      />
      <Tooltip
        anchorId="view-all-popular"
        place="bottom"
        content="All popular"
        noArrow
      />
      <Tooltip
        anchorId="view-all-hosts"
        place="bottom"
        content="All hosts"
        noArrow
      />
      <Tooltip
        anchorId="view-all-new-spaces"
        place="bottom"
        content="New spaces"
        noArrow
      />
    </>
  );
};

export default HomePage;
