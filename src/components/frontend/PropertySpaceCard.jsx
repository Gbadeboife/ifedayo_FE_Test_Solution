import React, { useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Link } from "react-router-dom";
import MkdSDK from "@/utils/MkdSDK";
import PersonIcon from "./icons/PersonIcon";
import StarIcon from "./icons/StarIcon";
import FavoriteButton from "./FavoriteButton";

let sdk = new MkdSDK();

const PropertySpaceCard = ({ data, forceRender, isFav }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <SkeletonTheme enableAnimation={false}>
      <Link
        to={`/property/${data.id}`}
        state={data}
        className={`overflow-hidden relative flex flex-col ${data.id ? "" : "pointer-events-none"}`}
      >
        <img
          src={data.url}
          className="w-full rounded-lg h-[var(--property-card-img-height)] object-cover mb-2"
          alt={data.name}
          onLoad={() => setImageLoaded(true)}
        />
        {imageLoaded ? (
          <div className="absolute z-1 w-full h-[var(--property-card-img-height)] top-0 left-0 mb-[8px] flex flex-col px-[8px] pb-[13px]">
            <FavoriteButton
              space_id={data.id}
              user_property_spaces_id={data.user_property_spaces_id}
              reRender={forceRender}
              withLoader={true}
            />
            <span className="px-2 py-1 text-white bg-black font-bold rounded-lg text-xs self-start">{data.category || <Skeleton />}</span>
          </div>
        ) : (
          <Skeleton className="!absolute z-1 w-full h-[var(--property-card-img-height)] top-0 left-0 !rounded-lg" />
        )}
        {/* Need to move this up because of br caused by skeleton */}
        <div className={`px-[12px] ${imageLoaded ? "" : "-mt-5"} flex-grow flex flex-col`}>
          <h4 className="text-lg font-semibold">{data.name || <Skeleton />}</h4>
          <p className="text-gray-500 mb-[6px] truncate flex-grow">{data.city ? data.city + ", " + data.country : <Skeleton />}</p>
          <div className="flex justify-between items-end lowercase">
            <p>
              {data.rate ? "from:" : <Skeleton width={100} />}{" "}
              {data.rate ? (
                <>
                  <span className="font-bold">${data.rate}</span> / <span className="">hour</span>
                </>
              ) : (
                <>
                  <span></span>
                  <span></span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              {data.max_capacity ? <PersonIcon /> : <span></span>}

              <span>{data.max_capacity || <Skeleton />}</span>
            </div>
            <p className="flex gap-2 items-center">
              {data.max_capacity ? <StarIcon /> : <span></span>}
              {data.rate ? <span>{(Number(data.average_space_rating) || 0).toFixed(1)}</span> : <span></span>}
            </p>
          </div>
        </div>
      </Link>
    </SkeletonTheme>
  );
};

export default PropertySpaceCard;
