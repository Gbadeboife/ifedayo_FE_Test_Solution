import { AuthContext } from "@/authContext";
import { isNotInViewport } from "@/utils/utils";
import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import { NavLink } from "react-router-dom";
import Icon from "../Icons";
import HeartIcon from "./icons/HeartIcon";
import LogoutIcon from "./icons/LogoutIcon";
import SearchIcon from "./icons/SearchIcon";

export default function BottomNav({ scrollDir, showAccount }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { dispatch } = useContext(AuthContext);

  const [showStaticBar, setShowStaticBar] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowStaticBar(isNotInViewport("search-bar"));
    };
    window.addEventListener("scroll", onScroll);
    setShowStaticBar(isNotInViewport("search-bar"));

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  function logout() {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  }

  const whiteList = ["/search", "/"];

  if (!whiteList.some((path) => pathname == path)) return null;

  return (
    <div className={`${scrollDir == "UP" && showStaticBar ? "block" : "hidden"} md:hidden bg-white py-1 fixed bottom-0 left-0 right-0 z-[200] bottom-nav border-t border-b slideUp`}>
      <div className="flex justify-center text-sm">
        <NavLink
          to="/explore"
          className="px-4 py-2 flex flex-col items-center justify-between"
        >
          <SearchIcon stroke={"black"} />
          Explore
        </NavLink>
        <NavLink
          to="/favorites"
          className="px-4 py-2 flex flex-col items-center justify-between"
        >
          <HeartIcon stroke={"black"} />
          Favorites
        </NavLink>
        <NavLink
          to={showAccount ? "/account/profile" : "/login"}
          className="px-4 py-2 flex flex-col items-center justify-between"
        >
          <Icon
            type="user"
            fill=""
            variant="circle"
            className={"my-stroke-" + "white"}
          />
          {showAccount ? "Account" : "Login"}
        </NavLink>
        <button
          className={`${showAccount ? "flex" : "hidden"} px-4 py-2 flex-col items-center justify-between`}
          onClick={logout}
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </div>
  );
}
