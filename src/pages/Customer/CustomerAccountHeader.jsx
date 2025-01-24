import React from "react";
import { Outlet, useLocation } from "react-router";
import NavBarSlider from "@/components/frontend/NavBarSlider";

export default function CustomerAccountHeader() {
  const { pathname } = useLocation();
  const menuBlacklist = ["/account/verification", "/account/my-bookings/", "/account/my-spaces/"];

  return (
    <div className="container mx-auto min-h-screen px-4 2xl:px-32">
      <header className="bg-white pt-[120px] normal-case">{menuBlacklist.every((path) => !pathname.startsWith(path)) && <NavBarSlider />}</header>
      <Outlet />
    </div>
  );
}
