import React from "react";
import { Outlet } from "react-router";
import { Link } from "react-router-dom";
import Icon from "@/components/Icons";
import { LoginContextProvider } from "./loginContext";

const PageWrapper = () => {
  return (
    <LoginContextProvider>
      <div>
        <header className="absolute top-0 left-0 pt-4 md:pl-16 pl-6">
          <Link to="/">
            <Icon
              type="logo"
              fill="fill-[#101828]"
            />
          </Link>
        </header>
        <Outlet />
      </div>
    </LoginContextProvider>
  );
};

export default PageWrapper;
