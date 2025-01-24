import React from "react";
import { Outlet } from "react-router";
import { SpaceContextProvider } from "./spaceContext";


const PageWrapper = () => {
  return (
    <div>
      <SpaceContextProvider>
        <Outlet />
      </SpaceContextProvider>
    </div>
  );
};

export default PageWrapper;
