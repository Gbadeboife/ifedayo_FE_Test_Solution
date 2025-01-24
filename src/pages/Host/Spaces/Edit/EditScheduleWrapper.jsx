import React from "react";
import EditSpaceSchedulingPage from "./EditSpaceSchedulingPage";
import { SpaceContextProvider } from "./spaceContext";

const EditScheduleWrapper = () => (
  <SpaceContextProvider>
    <EditSpaceSchedulingPage />
  </SpaceContextProvider>
);
export default EditScheduleWrapper;
