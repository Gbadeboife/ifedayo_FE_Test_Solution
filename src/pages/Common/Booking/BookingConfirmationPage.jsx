import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CircleCheckIcon from "@/components/frontend/icons/CircleCheckIcon";
import DateTimeIcon from "@/components/frontend/icons/DateTimeIcon";
import GreenCheckIcon from "@/components/frontend/icons/GreenCheckIcon";
import PersonIcon from "@/components/frontend/icons/PersonIcon";
import StarIcon from "@/components/frontend/icons/StarIcon";
import Icon from "@/components/Icons";
import { callCustomAPI } from "@/utils/callCustomAPI";
import MkdSDK from "@/utils/MkdSDK";
import { useBookingContext } from "./bookingContext";
import { daysMapping, monthsMapping } from "@/utils/date-time-utils";
import FavoriteButton from "@/components/frontend/FavoriteButton";
import PropertySpaceMapImage from "@/components/frontend/PropertySpaceMapImage";
import { usePropertySpace } from "@/hooks/api";

let sdk = new MkdSDK();

const BookingConfirmationPage = () => {
  const { bookingData } = useBookingContext();
  const [booking, setBooking] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();
  const [render, forceRender] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { propertySpace } = usePropertySpace(booking.property_space_id, render);

  async function fetchBooking(booking_id) {
    const where = [`ergo_booking.id = ${booking_id} AND ergo_booking.deleted_at IS NULL`];
    try {
      const result = await callCustomAPI("booking/details", "post", { where }, "");
      setBooking(result.list ?? {});
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

  useEffect(() => {
    fetchBooking(bookingData.id ?? id);
  }, []);

  return (
    <div className="container mx-auto px-6 pt-24 normal-case 2xl:px-16">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
        >
          <Icon
            type="arrow"
            variant="narrow-left"
            className="h-4 w-4 stroke-[#667085]"
          />{" "}
          <span className="ml-2">Back</span>
        </button>
      </div>
      <div className="mb-[22px] flex flex-col justify-between md:flex-row">
        <div className="mb-6 flex flex-wrap items-center justify-center md:mb-0">
          <GreenCheckIcon />
          <h1 className="mr-3 text-xl font-semibold text-[#101828] md:text-3xl">Booking request successful</h1>
        </div>
        <Link
          to="/account/my-bookings"
          className="rounded-md border border-[#EAECF0] bg-[#F9FAFB] px-4 py-2 text-center text-[#101828]"
        >
          Go to my bookings
        </Link>
      </div>
      <div className="flex flex-wrap items-start md:gap-[24px]">
        <div className="w-full md:w-[55%]">
          <div className="mb-[32px] rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-2 py-[16px] text-sm md:px-[20px] md:text-base">
            <div className="flex items-start gap-[12px]">
              <svg
                width="60"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.99984 13.3333V9.99996M9.99984 6.66663H10.0082M18.3332 9.99996C18.3332 14.6023 14.6022 18.3333 9.99984 18.3333C5.39746 18.3333 1.6665 14.6023 1.6665 9.99996C1.6665 5.39759 5.39746 1.66663 9.99984 1.66663C14.6022 1.66663 18.3332 5.39759 18.3332 9.99996Z"
                  stroke="#475467"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-[#101828]">What's next</h3>
                <p className="text-[#667085]">
                  Your booking has been sent to the host and will be reviewed within 2 hours. If you don’t hear form the host withing 2h you can cancel your booking or reach out to them via{" "}
                  <span className="font-semibold underline">Messages</span>.<br />
                  <span className="font-semibold">Note: Payment is only after the host accepts your booking</span>
                </p>
              </div>
            </div>
          </div>
          <li className="mb-6 text-xl font-semibold">Booking Time</li>
          <div className="mb-[32px] flex items-center justify-around rounded-lg border border-[#EAECF0] px-[20px] py-[16px]">
            <div className="w-[80px] rounded-lg border text-center">
              <p className="rounded-t-lg bg-black py-2 uppercase text-white">{monthsMapping[new Date(booking.booking_start_time).getMonth()] ?? "N/A"}</p>
              <strong className="text-3xl">{new Date(booking.booking_start_time).getDate() || "N/A"}</strong>
              <p className="uppercase text-[#667085]">{daysMapping[new Date(booking.booking_start_time).getDay()] ?? "N/A"}</p>
            </div>
            <div className="flex flex-col gap-[10px] md:flex-row md:gap-[67px]">
              <div className="flex gap-[10px]">
                <DateTimeIcon />
                <p className="text-lg">From</p>
                <strong>{bookingData.from}</strong>
              </div>
              <div className="flex gap-[10px]">
                <DateTimeIcon />
                <p className="text-lg">Until</p>
                <strong>{bookingData.to}</strong>
              </div>
            </div>
          </div>
          <li className="mb-6 text-xl font-semibold">Space</li>
          <div className="mb-[32px] flex max-w-full flex-col rounded-lg border border-[#EAECF0] bg-[#F9FAFB] lg:min-h-[167px] lg:w-[unset] lg:flex-row lg:gap-[32px]">
            <div
              className="mb-[8px] flex h-[180px] w-full flex-col rounded-lg bg-cover bg-center bg-no-repeat px-[8px] pb-[13px] lg:w-[262px]"
              style={{ backgroundImage: `url(${booking.image_url ?? bookingData.url ?? "/default-property.jpg"})` }}
            >
              <FavoriteButton
                space_id={bookingData.id}
                user_property_spaces_id={propertySpace.user_property_spaces_id}
                reRender={forceRender}
              />
            </div>
            <div className="flex flex-grow items-end justify-between py-6 pl-4 pr-4 lg:items-start lg:pl-0 lg:pr-8">
              <div className="">
                <h2 className="mb-[6px] text-[18px] font-semibold">{booking.property_name ?? bookingData.name}</h2>
                <p className="tracking-wider text-[#475467]">{propertySpace.city}</p>
                <p className="tracking-wider text-[#475467]">{propertySpace.country}</p>
                <div className="mt-[6px] flex lg:mt-[21px]">
                  <p className="mr-[31px]">
                    from: <span className="font-bold">${booking.hourly_rate}</span>/<span className="">day</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <PersonIcon />
                    <span>{propertySpace.max_capacity}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <p className="flex items-center gap-2 lg:mb-[9px]">
                  <StarIcon />
                  <strong className="font-semibold">{(Number(propertySpace.average_space_rating) || 0).toFixed(1)}</strong>
                </p>
                <button
                  className="whitespace-nowrap text-sm underline"
                  target="_blank"
                  onClick={() => setShowMap(true)}
                >
                  (view on map)
                </button>
              </div>
            </div>
          </div>
          <li className="mb-6 text-xl font-semibold">Add-ons:</li>

          {/* <ul className="addons-grid mb-32">
            {(booking.add_ons ?? []).map((addon, idx) => (
              <li
                className="flex"
                key={idx}
              >
                <span className="w-[200px]">
                  {" "}
                  <div className="flex gap-4">
                    <CircleCheckIcon /> {addon.name}
                  </div>{" "}
                </span>{" "}
              </li>
            ))}
          </ul> */}
          <ul className="w-full sm:flex flex-wrap gap-8">
            {(booking.add_ons ?? []).map((addon, idx) => (
              <li
                className="flex w-fit sm:w-full items-center gap-2 mb-4 sm:mb-0"
                key={idx}
              >
                <span className="w-fit">
                  {" "}
                  <div className="flex gap-4">
                    <CircleCheckIcon /> {addon.name}
                  </div>{" "}
                </span>{" "}
              </li>
            ))}
          </ul>
        </div>
        <div className="max-w-full flex-grow">
          <div className="mb-[16px] rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-[20px] py-[24px] text-sm md:px-[32px] md:text-base">
            <h4 className="text-lg mb-[8px] font-semibold md:text-2xl">Charges</h4>
            <p className="mb-[16px] text-xs text-[#667085] md:text-sm">(You will not be charged until the host accepts your booking)</p>
            <div className="mb-[12px] flex justify-between">
              <p>Rate</p>
              <p className="font-semibold text-[#344054]"> ${booking.hourly_rate}</p>
            </div>
            <div className="mb-[12px] flex justify-between">
              <p>Price</p>
              <p className="font-semibold text-[#344054]"> ${(booking.hourly_rate ?? 0) * ((booking.duration ?? 0) / 3600)}</p>
            </div>
            {(booking.add_ons ?? []).map((addon) => (
              <div
                className="mb-[12px] flex justify-between"
                key={addon.id}
              >
                <p>{addon.name}</p>
                <p className="font-semibold text-[#344054]"> ${addon.cost}</p>
              </div>
            ))}

            <div className="mb-[16px] flex justify-between">
              <p>Tax</p>
              <p className="font-semibold text-[#344054]"> ${booking.tax}</p>
            </div>
            <div className="-mx-3 mb-[12px] flex justify-between rounded-md bg-black p-3 font-bold text-white">
              <p>Total</p>
              <p> ${booking.total}</p>
            </div>
          </div>
          <Link
            to={"/help/cancellation-policy"}
            target="_blank"
            className="block text-center font-semibold text-[#667085] underline"
          >
            Cancellation policy
          </Link>
        </div>
      </div>
      <PropertySpaceMapImage
        modalImage={`https://maps.googleapis.com/maps/api/staticmap?center=${propertySpace.address_line_1 || ""}, ${propertySpace.address_line_2 || ""}, ${propertySpace.city || ""}, ${propertySpace.country || ""
          }&zoom=15&size=600x400&maptype=roadmap&markers=color:red|${propertySpace.address_line_1 || ""}, ${propertySpace.address_line_2 || ""}
      &key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
        modalOpen={showMap}
        closeModal={() => setShowMap(false)}
      />
    </div>
  );
};

export default BookingConfirmationPage;
