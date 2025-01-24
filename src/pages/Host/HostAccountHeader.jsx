import React from "react";
import { Outlet, useLocation } from "react-router";
import { Link } from "react-router-dom";
import WelcomeIcon from "@/components/frontend/icons/WelcomeIcon";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import NavBarSlider from "@/components/frontend/NavBarSlider";
import { ID_VERIFICATION_STATUSES } from "@/utils/constants";
import { useState } from "react";
import { useEffect } from "react";

export default function HostAccountHeader() {
  const { pathname } = useLocation();
  const { state: globalState } = useContext(GlobalContext);

  const toastBlacklist = ["/account/verification", "/account/my-bookings/", "/account/my-spaces/"];
  const menuBlacklist = ["/account/verification", "/account/my-bookings/", "/account/my-spaces/"];

  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    // TODO: fix this so it only shows toast on first login
    setToastOpen(globalState.user.getting_started == 0);
  }, [globalState.user.getting_started]);

  return (
    <div className="container mx-auto min-h-screen px-4 2xl:px-32">
      <header className="bg-white pt-[120px] normal-case">
        <div className={`${toastOpen ? "block" : "hidden"} mb-[32px] rounded-xl border border-[#EAECF0] bg-[#F9FAFB] px-[21px] py-[19px]`}>
          <div className="mb-2 flex justify-between">
            <h1 className="flex gap-2">
              <WelcomeIcon />
              <span className="text-xl font-semibold">Welcome to Ergo</span>
            </h1>
            <button onClick={() => setToastOpen(false)}>&#x2715;</button>
          </div>
          <p className="ml-7 max-w-3xl p-5 text-[#667085]">
            {true ? (
              <>
                {" "}
                This is your host panel, where you can handle all things related to your spaces and bookings. NOTE: Before publishing space(s) you need to complete your{" "}
                <Link
                  to="/account/profile"
                  className="font-semibold underline"
                >
                  ’Profile’
                </Link>{" "}
                and get verified.
              </>
            ) : globalState.user.verificationStatus != ID_VERIFICATION_STATUSES.VERIFIED ? (
              <>
                Before publishing space(s) you need to complete your{" "}
                <Link
                  to="/account/profile"
                  className="font-semibold underline"
                >
                  ’Profile’
                </Link>{" "}
                and get verified.
              </>
            ) : (
              <></>
            )}
          </p>
        </div>
        {menuBlacklist.every((path) => !pathname.startsWith(path)) && <NavBarSlider />}
      </header>
      <Outlet />
    </div>
  );
}
