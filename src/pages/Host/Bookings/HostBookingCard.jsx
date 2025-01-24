import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { Link } from "react-router-dom";
import { callCustomAPI } from "@/utils/callCustomAPI";
import MkdSDK from "@/utils/MkdSDK";
import { parseJsonSafely, secondsToHour } from "@/utils/utils";
import { formatDiff, monthsMapping } from "@/utils/date-time-utils";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@/utils/constants";
import moment from "moment";
import { FavoriteButton } from "@/components/frontend";
import { ClockIcon } from "@heroicons/react/24/outline";
import BookingDeclineModal from "./BookingDeclineModal";
import AcceptBookingModal from "./AcceptBookingModal";

let sdk = new MkdSDK();

export default function HostBookingCard({ tourReview, data, forceRender, favoriteId }) {
  const statusMapping = ["Pending", "Upcoming", "Ongoing", "Completed", "Declined", "Canceled", "Expired"];
  const statusColorMapping = ["text-white", "my-text-gradient", "text-[yellow]", "text-[#667085]", "text-[#D92D20]", "text-[#DC6803]", "text-[#D92D20] !bg-[#F2F4F7]"];
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const [declinePopup, setDeclinePopup] = useState(false);
  const [acceptPopup, setAcceptPopup] = useState(false);
  const [countdown, setCountdown] = useState({});
  const [imageLoaded, setImageLoaded] = useState(false);
  const bookingExpired = data.booking_start_time && data.status < 2 ? new Date(data.booking_end_time) < Date.now() : false;

  async function cancelBooking(id) {
    const payload = {
      id,
      booked_unit: 1,
      status: BOOKING_STATUS.CANCELLED,
    };
    try {
      await callCustomAPI("booking", "post", payload, "PUT");
      if (data.status === BOOKING_STATUS.UPCOMING) {
        await sdk.callRawAPI("/v2/api/custom/ergo/refund", { booking_id: data.id, stripe_payment_intent_id: data.stripe_payment_intent_id }, "POST");
      }
      sendCancelEmail(data.customer_id, data.property_name, `from ${moment(data.booking_start_time).format("MM/DD/YYYY")} to ${moment(data.booking_end_time).format("MM/DD/YYYY")}`, reason);
      if (forceRender) {
        forceRender(new Date());
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  async function sendCancelEmail(id, space_name, time) {
    try {
      // get user email and preferences
      const result = await callCustomAPI("get-user", "post", { id }, "");
      const tmpl = await sdk.getEmailTemplate("booking-cancelled");

      if (parseJsonSafely(result.settings, {}).email_on_booking_cancelled == true) {
        const body = tmpl.html?.replace(new RegExp("{{{space_name}}}", "g"), space_name).replace(new RegExp("{{{time}}}", "g"), time);
        await sdk.sendEmail(result.email, tmpl.subject, body);
      }

      if (parseJsonSafely(globalState.user.settings, {}).email_on_booking_cancelled == true) {
        const body = tmpl.html?.replace(new RegExp("{{{space_name}}}", "g"), space_name).replace(new RegExp("{{{time}}}", "g"), time);
        await sdk.sendEmail(globalState.user.email, tmpl.subject, body);
      }
    } catch (err) { }
  }

  useEffect(() => {
    if (data.status != BOOKING_STATUS.UPCOMING && !bookingExpired) return;
    let interval = null;
    if (!data.booking_start_time) {
      return () => clearInterval(interval);
    }
    interval = setInterval(() => {
      const diff = formatDiff(data.booking_start_time);
      setCountdown(diff);
    }, 1000);
  }, [data.booking_start_time]);

  return (
    <>
      <div className="mb-10 hidden border lg:flex">
        <div className="relative min-w-[16rem]">
          <img
            src={data.image_url}
            onLoad={() => setImageLoaded(true)}
            alt=""
            className="absolute top-0 left-0 h-full w-full object-cover"
          />
          {data.status == BOOKING_STATUS.UPCOMING && !bookingExpired && (
            <div className="absolute inset-0 flex items-end justify-start px-4 py-2 normal-case">
              <div className="flex rounded-md bg-[#13131366] py-1 px-2 font-semibold text-white">
                <ClockIcon className="h-6 w-6" /> : <span className="mx-1">{countdown.timeLeft}</span>
                <span className="normal-case">{countdown.format}</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 px-2">
            <FavoriteButton
              className={`${imageLoaded ? "flex" : "flex"} flex-grow justify-end pt-2`}
              space_id={data.property_space_id}
              user_property_spaces_id={favoriteId}
              reRender={forceRender}
              withLoader={true}
            />
          </div>
          {!imageLoaded && <Skeleton className="absolute -top-1 left-0 h-full w-full" />}
        </div>
        <div className="flex flex-grow gap-16 px-8 py-6 xl:gap-24 2xl:gap-32">
          <div className="flex max-w-sm flex-grow flex-col space-y-3">
            <h3 className="text-2xl font-semibold">{data.property_name || <Skeleton width={180} />}</h3>
            <p className="tracking-wider"> {!data.property_name ? <Skeleton width={150} /> : data.address_line_1}</p>
            <p className="tracking-wider"> {!data.property_name ? <Skeleton width={150} /> : data.address_line_2}</p>
            {data.property_name ? (
              <p className="tracking-wider">
                <span>Guest</span>: {data.customer_first_name} {data.customer_last_name}
              </p>
            ) : (
              <Skeleton width={100} />
            )}
          </div>
          <div className="flex flex-col justify-between">
            {data.booking_start_time ? (
              <div className="flex justify-between gap-6">
                <p className="whitespace-nowrap">Date</p>
                <strong className="whitespace-nowrap">
                  {monthsMapping[new Date(data.booking_start_time).getMonth()] + " " + new Date(data.booking_start_time).getDate() + "/" + new Date(data.booking_start_time).getFullYear()}
                </strong>
              </div>
            ) : (
              <Skeleton width={100} />
            )}
            {data.duration ? (
              <div className="flex justify-between gap-6">
                <p className="whitespace-nowrap">Duration</p>
                <strong className="whitespace-nowrap">{secondsToHour(data.duration)}</strong>
              </div>
            ) : (
              <Skeleton width={100} />
            )}
            {data.duration ? (
              <div className="flex justify-between gap-6">
                <p className="whitespace-nowrap">Total Price</p>
                <strong className="whitespace-nowrap">${((data?.total ?? 0) + (data?.addon_cost ?? 0)).toFixed(2)}</strong>
              </div>
            ) : (
              <Skeleton width={100} />
            )}
          </div>
          <div className="flex w-full items-end justify-between lg:w-[200px] lg:flex-col  lg:items-end lg:justify-center">
            <span
              className={`${data.status == 0 ? "bg-black" : "bg-[#F2F4F7]"} rounded-sm px-[16px] py-[8px] ${statusColorMapping[bookingExpired ? 6 : data.status ?? 0]
                } mb-[16px] whitespace-nowrap border text-sm font-semibold uppercase`}
            >
              {" "}
              {statusMapping[bookingExpired ? 6 : data.status ?? 0]}
            </span>
            {data.id && (
              <Link
                className={`mb-[32px] hidden text-sm font-semibold underline lg:inline w-full text-end ${tourReview}`}
                to={"/account/my-bookings/" + data.id}
              >
                View details
              </Link>
            )}

            {(() => {
              if (!bookingExpired && data.status == BOOKING_STATUS.PENDING) {
                return (
                  <div>
                    {data.status === BOOKING_STATUS.PENDING &&

                      <button
                        className="my-text-gradient text-sm font-semibold"
                        onClick={() => setAcceptPopup(true)}
                      >
                        Accept
                      </button>
                    }{" "}
                    |{" "}
                    <button
                      className="text-sm font-semibold text-[#DC6803]"
                      onClick={() => setDeclinePopup(true)}
                    >
                      Decline
                    </button>
                  </div>
                );
              } else if (!bookingExpired && data.payment_status !== PAYMENT_STATUS.SUCCESSFUL) {
                return (
                  <button
                    className={`${data.status < 2 ? "inline" : "hidden"} text-sm font-semibold text-[#667085]`}
                    onClick={() => cancelBooking(data.id)}
                  >
                    Cancel
                  </button>
                );
              }
            })()}
          </div>
        </div>
      </div>
      <div className="mb-10 flex items-start justify-between border lg:hidden">
        <div className="w-1/2">
          <div className="relative h-40">
            <img
              src={data.image_url}
              onLoad={() => setImageLoaded(true)}
              alt=""
              className="absolute top-0 left-0 h-full w-full object-cover"
            />
            {!imageLoaded && <Skeleton className="absolute -top-1 left-0 h-full w-full" />}
            {data.status == BOOKING_STATUS.UPCOMING && !bookingExpired && (
              <div className="absolute inset-0 flex items-end justify-start px-4 py-2 normal-case">
                <div className="flex rounded-md bg-[#13131366] py-1 px-2 font-semibold text-white">
                  <ClockIcon className="h-6 w-6" /> : <span className="mx-1">{countdown.timeLeft}</span>
                  <span className="normal-case">{countdown.format}</span>
                </div>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="mb-2 text-2xl font-semibold">{data.property_name || <Skeleton width={180} />}</h3>
            <p className="mb-2 tracking-wider">
              {" "}
              {!data.property_name ? <Skeleton width={150} /> : ([1, 2].includes(data.status) && !bookingExpired ? data.address_line_1 : data.property_city) ?? "N/A"}
            </p>
            <p className="mb-2 tracking-wider">
              {" "}
              {!data.property_name ? <Skeleton width={150} /> : ([1, 2].includes(data.status) && !bookingExpired ? data.address_line_2 : data.property_country) ?? "N/A"}
            </p>
            {data.property_name ? (
              <p className="mb-2 tracking-wider">
                <span>Host</span>: {data.host_first_name} {data.host_last_name}
              </p>
            ) : (
              <Skeleton width={100} />
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 pt-4 pr-3">
          <span
            className={`${data.status == 0 ? "bg-black" : "bg-[#F2F4F7]"} rounded-sm px-[16px] py-[8px] ${statusColorMapping[bookingExpired ? 6 : data.status ?? 0]
              } mb-[16px] border text-sm font-semibold uppercase`}
          >
            {" "}
            {statusMapping[bookingExpired ? 6 : data.status ?? 0]}
          </span>
          {data.id && (
            <Link
              className="mb-[32px] text-sm font-semibold underline"
              to={"/account/my-bookings/" + data.id}
            >
              View detail
            </Link>
          )}

          {!bookingExpired && data.status == 0 ? (
            <div>
              {data.payment_status === PAYMENT_STATUS.PENDING &&

                <button
                  className="my-text-gradient text-sm font-semibold"
                  onClick={() => setAcceptPopup(true)}
                >
                  Accept
                </button>
              }{" "}
              |{" "}
              <button
                className="text-sm font-semibold text-[#DC6803]"
                onClick={() => setDeclinePopup(true)}
              >
                Decline
              </button>
            </div>
          ) : (
            (!bookingExpired && data.payment_status !== PAYMENT_STATUS.SUCCESSFUL) && (

              <button
                className={`${data.status < 2 ? "inline" : "hidden"} text-sm font-semibold text-[#667085]`}
                onClick={() => cancelBooking(data.id)}
              >
                Cancel
              </button>
            )
          )}
        </div>
      </div>
      <BookingDeclineModal
        modalOpen={declinePopup}
        closeModal={() => setDeclinePopup(false)}
        onSuccess={() => forceRender(true)}
        booking={data}
      />
      <AcceptBookingModal
        modalOpen={acceptPopup}
        closeModal={() => setAcceptPopup(false)}
        onSuccess={() => forceRender(true)}
        booking={data}
      />
    </>
  );
}
