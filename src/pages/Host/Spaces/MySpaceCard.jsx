import { monthsMapping } from "@/utils/date-time-utils";
import React, { useState } from "react";
import { useContext } from "react";
import Skeleton from "react-loading-skeleton";
import { Link, useNavigate } from "react-router-dom";
import { GlobalContext } from "@/globalContext";
import { DRAFT_STATUS, SPACE_VISIBILITY } from "@/utils/constants";
import MkdSDK from "@/utils/MkdSDK";
import { AuthContext, tokenExpireError } from "@/authContext";
import { FavoriteButton } from "@/components/frontend";
import ThreeDotsMenu from "@/components/frontend/ThreeDotsMenu";
import StarIcon from "@/components/frontend/icons/StarIcon";
import PersonIcon from "@/components/frontend/icons/PersonIcon";

export default function MySpaceCard({ data, forceRender, reset }) {
  const navigate = useNavigate();
  const statusMapping = ["Under review", "Active", "Rejected"];
  const statusColorMapping = ["text-[#667085]", "my-text-gradient", "text-[#DC6803]"];
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  const [imageLoaded, setImageLoaded] = useState(false);
  const sdk = new MkdSDK();

  async function hidePropertySpace(id) {
    try {
      await sdk.callRawAPI("/rest/property_spaces/PUT", { id, availability: SPACE_VISIBILITY.HIDDEN }, "POST");
      forceRender(new Date());
      if (reset) {
        reset();
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  async function showPropertySpace(id) {
    try {
      await sdk.callRawAPI("/rest/property_spaces/PUT", { id, availability: SPACE_VISIBILITY.VISIBLE }, "POST");
      forceRender(new Date());
      if (reset) {
        reset();
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  return (
    <>
      <div className="mx-auto mb-10 flex max-w-md flex-col border lg:max-w-none lg:flex-row">
        <div className="relative h-40 min-w-[16rem] lg:h-[unset]">
          {!!data.url &&
            <><img
              src={data.url}
              onLoad={() => setImageLoaded(true)}
              alt=""
              className="absolute top-0 left-0 h-full w-full object-cover" /><div className="absolute inset-0 px-2">
                <FavoriteButton
                  className={`${imageLoaded ? "flex" : "flex"} flex-grow justify-end pt-2`}
                  space_id={data.id}
                  user_property_spaces_id={data.user_property_spaces_id}
                  reRender={forceRender} />
              </div></>
          }
          {!data.url && <Skeleton className="absolute -top-1 left-0 h-full w-full" />}
        </div>
        <div className="flex flex-grow flex-col gap-8 px-4 py-6 lg:flex-row lg:gap-16 lg:px-8 xl:gap-24 2xl:gap-32">
          <div className="flex w-full flex-grow flex-col justify-start space-y-3 lg:max-w-sm lg:justify-between lg:space-y-0">
            <h3 className="text-2xl font-semibold">{data.name || <Skeleton width={180} />}</h3>
            <p className="tracking-wider"> {data.address_line_1 || <Skeleton width={150} />}</p>
            {data.id ? (
              <div className="flex items-end justify-between lowercase">
                <p className="flex-grow">
                  from: <span className="font-bold">${data.rate}</span>/<span className="">h</span>
                </p>
                <div className="flex justify-between gap-6 lg:flex-grow lg:gap-0">
                  <div className="ml-auto mr-5 flex items-center gap-2 md:ml-[unset] md:mr-[unset]">
                    <PersonIcon />
                    <span>{data.max_capacity}</span>
                  </div>
                  <p className="flex items-center gap-2">
                    <StarIcon />
                    <span>{(Number(data.average_space_rating) || 0).toFixed(1)}</span>
                  </p>
                </div>
              </div>
            ) : (
              <Skeleton />
            )}
          </div>
          <hr className="block w-full lg:hidden" />
          <div className="flex flex-col justify-between space-y-3 lg:space-y-0">
            {data.id ? (
              <div className="flex justify-between gap-6">
                <p className="whitespace-nowrap">Created</p>
                <strong className="whitespace-nowrap">
                  {monthsMapping[new Date(data.create_at).getMonth()] + " " + new Date(data.create_at).getDate() + "/" + new Date(data.create_at).getFullYear()}
                </strong>
              </div>
            ) : (
              <Skeleton width={100} />
            )}
            {data.id ? (
              <div className="flex justify-between gap-6">
                <p className="whitespace-nowrap">Total Bookings</p>
                <strong className="whitespace-nowrap">{data.booking_count}</strong>
              </div>
            ) : (
              <Skeleton width={100} />
            )}
            {data.id ? (
              <div className="flex justify-between gap-6">
                <p className="whitespace-nowrap">Reviews</p>
                <strong className="whitespace-nowrap">{data.space_rating_count ?? 0}</strong>
              </div>
            ) : (
              <Skeleton width={100} />
            )}
          </div>
          <hr className="block w-full lg:hidden" />
          <div className="flex w-full items-end justify-between lg:w-[200px] lg:flex-col  lg:items-end lg:justify-center">
            <span
              className={`rounded-sm bg-[#F2F4F7] px-[17px] py-[8px] ${data.draft_status < DRAFT_STATUS.COMPLETED ? "text-[#DC6803]" : statusColorMapping[data.space_status]
                } mb-[16px] whitespace-nowrap border text-sm font-semibold uppercase`}
            >
              {" "}
              {(data.draft_status < DRAFT_STATUS.COMPLETED ? "DRAFT" : statusMapping[data.space_status]) || <Skeleton width={80} />}
            </span>
            {data.id && (
              <Link
                to={"/account/my-spaces/" + data.id}
                className="mb-[32px] hidden text-sm font-semibold underline lg:inline w-full text-end"
                state={data}
              >
                View details
              </Link>
            )}

            {(() => {
              if (data.space_status == 1 && data.availability == 1 && data.draft_status >= DRAFT_STATUS.COMPLETED) {
                return (
                  <button
                    className="hidden text-sm font-semibold text-[#667085] lg:inline"
                    onClick={() => hidePropertySpace(data.id)}
                  >
                    Deactivate
                  </button>
                );
              }
              if (data.space_status == 1 && data.availability == 0 && data.draft_status >= DRAFT_STATUS.COMPLETED) {
                return (
                  <button
                    className="hidden text-sm font-semibold text-[#1570EF] lg:inline"
                    onClick={() => showPropertySpace(data.id)}
                  >
                    Activate
                  </button>
                );
              }
            })()}
            <div className="inline border p-0.5 px-3 lg:hidden">
              <ThreeDotsMenu
                items={[
                  {
                    label: "Activate",
                    icon: <></>,
                    onClick: () => showPropertySpace(data.id),
                    notShow: !(data.space_status == 1 && data.availability == 0),
                  },
                  {
                    label: "Deactivate",
                    icon: <></>,
                    onClick: () => hidePropertySpace(data.id),
                    notShow: !(data.space_status == 1 && data.availability == 1),
                  },
                  {
                    label: "View Details",
                    icon: <></>,
                    onClick: () => {
                      navigate("/account/my-spaces/" + data.id);
                    },
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
