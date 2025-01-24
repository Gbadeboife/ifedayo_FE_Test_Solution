import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import { Mousewheel } from "swiper";
import HostCard from "./HostCard";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router";

export default function HostCardSlider({ hosts }) {
  const scrollTable = useRef(null);
  const navigate = useNavigate()

  const moveTable = (ref) => {
    ref.scrollLeft += 160;
  };
  const moveTableBack = (ref) => {
    ref.scrollLeft += -160;
  };

  return (
    <>
      {hosts.length == 0 && (
        <p className="text-center flex items-center justify-center normal-case min-h-[200px] max-w-fit">
          <b>No Hosts found</b>
        </p>
      )}


      <div
        ref={scrollTable}
        className="flex justify-between w-full overflow-auto sidebar-holdee">
        {hosts.length > 0 && hosts.map((host, idx) => (
          <div
            className=""
            key={idx}
          >
            <HostCard data={host} />
          </div>
        ))}
      </div>
      {/* !["/"].includes(location.pathname) &&  */}
      {(hosts.length > 3 && window.innerWidth > 800) &&
        <div className="flex items-center pb-2 gap-3 justify-center mx-auto w-full pt-6">
          <div className="cursor-pointer"
            onClick={() =>
              moveTableBack(scrollTable.current)
            }
          >
            <button
            type="button"
            onClick={() => navigate(`/admin/${backTo}`)}
            className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          </div>
          <div className="cursor-pointer" onClick={() => moveTable(scrollTable.current)}>
          <button
            type="button"
            onClick={() => navigate(`/admin/${backTo}`)}
            className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
          >
            <ArrowRightIcon className="h-6 w-6" />
          </button>
          </div>
        </div>
      }

    </>
  );
}
