import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { NavLink } from "react-router-dom";
import { Mousewheel } from "swiper";
import { useContext } from "react";
import { AuthContext } from "@/authContext";

export default function NavBarSlider() {
  const [swiper, setSwiper] = useState(null);
  const { state } = useContext(AuthContext);
  const role = state.role;

  const customerNavItems = [
    { name: "My Bookings", route: "/account/my-bookings" },
    { name: "Messages", route: "/account/messages" },
    { name: "Reviews", route: "/account/reviews" },
    { name: "Profile", route: "/account/profile" },
    { name: "Payment", route: "/account/payments" },
    { name: "Billing", route: "/account/billing" },
  ];
  const hostNavItems = [
    { name: "My Bookings", route: "/account/my-bookings" },
    { name: "Messages", route: "/account/messages" },
    { name: "Reviews", route: "/account/reviews" },
    { name: "My Spaces", route: "/account/my-spaces" },
    { name: "My Addons", route: "/account/my-addons" },
    { name: "My Amenities", route: "/account/my-amenities" },
    { name: "Profile", route: "/account/profile" },
    { name: "Payment", route: "/account/payments" },
    { name: "Billing", route: "/account/billing" },
  ];

  return (
    <div className="border-b">
      <Swiper
        slidesPerView={"auto"}
        centeredSlides={true}
        spaceBetween={0}
        mousewheel={true}
        className="navbar-slider"
        initialSlide={1}
        centeredSlidesBounds={true}
        modules={[Mousewheel]}
        onSwiper={setSwiper}
        breakpoints={{
          640: { enabled: false },
        }}
      >
        {(role == "host" ? hostNavItems : customerNavItems).map((items, i) => (
          <SwiperSlide
            className="!w-[120px] slider-menu text-center pb-3"
            key={items.route}
          >
            <NavLink
            className={`${items.name === "Reviews" && "thirteenth-step"} ${items.name === "Payment" && "twelfth-step"} ${items.name === "My Bookings" && "seventeen-step"}`}
              to={items.route}
              onClick={() => swiper.slideTo(i)}
            >
              {items.name}
            </NavLink>
          </SwiperSlide>
        ))}
        <div className="mover"></div>
      </Swiper>
    </div>
  );
}
