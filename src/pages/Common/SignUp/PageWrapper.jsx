import React from "react";
import { Outlet } from "react-router";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/Icons";
import { SignUpContextProvider } from "./signUpContext";

const PageWrapper = () => {
  return (
    <SignUpContextProvider>
      <div>
        <header className="absolute top-0 left-0 pt-4 md:pl-16 pl-6">
          <Link to="/">
            <Icon
              type="logo"
              fill="fill-[#101828]"
            />
          </Link>
        </header>
        <div className="min-h-screen flex justify-center w-full">
          <Outlet />
        </div>
      </div>
    </SignUpContextProvider>
  );
};

export default PageWrapper;
