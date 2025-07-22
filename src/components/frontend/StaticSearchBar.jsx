import React, { useContext, useState } from "react";
import { useEffect } from "react";
import { useLocation, useMatch, useNavigate } from "react-router";
import { createSearchParams, useSearchParams } from "react-router-dom";
import SearchIcon from "./icons/SearchIcon";
import ReactTestUtils from "react-dom/test-utils";
import { isNotInViewport, sleep } from "@/utils/utils";
import { useForm } from "react-hook-form";
import CustomLocationAutoCompleteV2 from "../CustomLocationAutoCompleteV2";
import CustomComboBox from "../CustomComboBox";
import { GlobalContext } from "@/globalContext";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import CustomStaticLocationAutoCompleteV2 from "../CustomStaticLocationAutoCompleteV2";

const StaticSearchBar = ({ className }) => {
  const navigate = useNavigate();
  const inSearchPage = useMatch("/search");
  const [searchParams, setSearchParams] = useSearchParams();
  const [showStaticBar, setShowStaticBar] = useState(isNotInViewport("search-bar"));
  const { pathname } = useLocation();
  const { state: globalState, dispatch } = useContext(GlobalContext);

  

  const categories = globalState.spaceCategories;

  const { handleSubmit, control, setValue } = useForm({ defaultValues: { category: "", location: globalState.location } });

  useEffect(() => {
    const onScroll = () => {
      setShowStaticBar(isNotInViewport("search-bar"));
    };
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setShowStaticBar(false);
  }, [pathname]);

  const onSubmit = async (data) => {
    const searchBar = document.getElementById("search-bar");

    if (inSearchPage && searchBar) {
      // submit search form
      if (data.category) searchParams.set("category", selected.category);
      if (globalState.location) searchParams.set("location", location);
      setSearchParams(searchParams);
      await sleep(500);
      ReactTestUtils.Simulate.submit(searchBar);
      return;
    }
    navigate({
      pathname: "/search",
      search: createSearchParams({
        location: globalState.location ?? "",
        category: data.category ?? "",
      }).toString(),
    });
  };

  if (!showStaticBar || !["/search", "/"].includes(pathname)) return null;

  return (
    <div className={className}>
      <form
        className="flex items-center w-full max-w-xl pl-1 bg-white border rounded-lg my-shadow2 rounded-r-pill md:rounded-r-lg md:pl-4 xl:ml-16 xl:max-w-3xl"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
        id="top-header-search-bar"
      >
        <CustomComboBox
          control={control}
          name="category"
          labelField="category"
          valueField="category"
          setValue={(val) => setValue("category", val)}
          items={categories}
          containerClassName="relative hidden h-[40px] items-center md:flex md:w-[500px]"
          className="w-full text-black truncate border-0 focus:outline-none"
          placeholder="Search by category"
        />

        <CustomStaticLocationAutoCompleteV2
          containerClassName={"flex h-[40px] w-full items-center gap-2 rounded-t-md bg-white px-2 pr-1 md:h-[unset] lg:max-w-[331px] lg:rounded-none lg:py-0"}
          placeholder="Search by city or zip code"
          className="border-0 focus:outline-none"
          // control={control}
          // name="location"
          type="static"
          setValue={(val) => dispatch({
            type: "SETLOCATION",
            payload: {
              location:val
            },
          })}
          suggestionType={["(regions)"]}
        />

        <button
          type="submit"
          className="login-btn-gradient hidden w-1/2 items-center justify-center gap-2 rounded-md rounded-tl-none rounded-bl-none py-3 tracking-wide text-white outline-none focus:outline-none md:flex md:w-[unset] md:px-4 lg:w-[unset]"
        >
          <SearchIcon className="md:w-[50px]" />
          <span className="hidden md:inline">Search</span>
        </button>
        <button className="flex items-center justify-center h-10 login-btn-gradient w-11 rounded-circle md:hidden">
          {" "}
          <MagnifyingGlassIcon className="w-5 h-5 font-semibold text-white" />
        </button>
      </form>
    </div>
  );
};
export default StaticSearchBar;
