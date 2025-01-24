
import { StarIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import PersonIcon from "./icons/PersonIcon";

import PropertySpaceMapImage from "./PropertySpaceMapImage";

const PropertySpaceTile = ({ data, forceRender }) => {
  const [showMap, setShowMap] = useState(false);
  var amenities = (data.amenities ?? "").split(",");
  amenities = Array.from(new Set(amenities));

  return (
    <>
      <Link
        to={`/property/${data.id}`}
        state={data}
        className="mb-[20px] border lg:flex-row flex-col flex lg:gap-[32px] lg:h-[220px] lg:w-[unset] w-full max-w-full my-shadow"
      >
        <div
          className="rounded-sm bg-cover bg-center bg-no-repeat flex flex-col px-[12px] pr-1 pb-[10px] lg:h-full h-[210px] lg:w-[262px] w-full space-tile"
          style={{ backgroundImage: `url('${data.url}')` }}
        >
          <FavoriteButton
            space_id={data.id}
            user_property_spaces_id={data.user_property_spaces_id}
            reRender={forceRender}
            withLoader={true}

          />
          <span className="px-2 py-1 text-white bg-black font-bold rounded-lg text-xs self-start">{data.category || "N/A"}</span>
        </div>
        <div className="py-6 md:flex flex-gro justify-between w-full items-end lg:pl-0 pl-4 pr-4 lg:pr-8">
          <div className="w-[200px]">
            <h2 className="text-[18px] font-semibold mb-[6px] w-full whitespace-normal md:whitespace-wrap">{data.name}</h2>
            <p className="text-[#475467] tracking-wider md:truncate mb-1">{data.city}</p>
            <p className="text-[#475467] tracking-wider md:truncate">{data.country} </p>
            <div className="lg:mt-[21px] mt-[6px] flex items-end">
              <p className="mr-[31px]">
                from: <span className="font-bold">${data.rate}</span>/<span className="">hour</span>
              </p>
              <div className="flex items-center gap-2">
                <PersonIcon />
                <span>{data.max_capacity}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full md:items-end mt-3 lg:mt-0">
            <div className="">
            <p className="flex text-xl gap-2 items-center lg:mb-[9px]">
              <StarIcon className="w-5" />
              <strong className="font-semibold">
                {(Number(data.average_space_rating) || 0).toFixed(1)}
                {Number(data.space_rating_count) > 0 &&
                  <span className="font-normal">({data.space_rating_count})</span>
                }
              </strong>
            </p>
            <button
              className="text-sm underline whitespace-nowrap mt-1 lg:mt-0"
              target="_blank"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMap(true);
              }}
            >
              (view on map)
            </button>
            </div>

            <div className="mt-2 lg:mt-[50px] lg:flex flex-wra max-w-[200px gap-[12px] whitespace-wrap">
              {amenities.slice(0, 3).map((am, idx) => (
                <span
                  className="text-[14px] bg-[#F2F4F7] h-fit rounded-[3px] pt-[2px] px-[8px] mr-1 lg:mr-0 pb-[3px] text-[#667085]"
                  key={idx}
                >
                  {am}
                </span>
              ))}
              {amenities.length > 3 ? <span className="text-[14px] bg-[#F2F4F7] rounded-[3px] pt-[2px] px-[8px] pb-[3px] text-[#667085]">+{amenities.length - 3} more</span> : null}
            </div>
          </div>
        </div>
      </Link>
      <PropertySpaceMapImage
        modalImage={`https://maps.googleapis.com/maps/api/staticmap?center=${data.address_line_1 || ""}, ${data.address_line_2 || ""}, ${data.city || ""}, ${data.country || ""
          }&zoom=15&size=600x400&maptype=roadmap&markers=color:red|${data.address_line_1 || ""}, ${data.address_line_2 || ""}
      &key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
        modalOpen={showMap}
        closeModal={() => setShowMap(false)}
      />
    </>
  );
};

export default PropertySpaceTile;
