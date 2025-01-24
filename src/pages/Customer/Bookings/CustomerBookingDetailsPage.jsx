import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import CircleCheckIcon from "@/components/frontend/icons/CircleCheckIcon";
import DateTimeIcon from "@/components/frontend/icons/DateTimeIcon";
import PersonIcon from "@/components/frontend/icons/PersonIcon";
import StarIcon from "@/components/frontend/icons/StarIcon";
import ThreeDotsMenu from "@/components/frontend/ThreeDotsMenu";
import Icon from "@/components/Icons";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { GlobalContext, showToast } from "@/globalContext";
import { daysMapping, monthsMapping, formatAMPM } from "@/utils/date-time-utils";
import NoteIcon from "@/components/frontend/icons/NoteIcon";
import FavoriteButton from "@/components/frontend/FavoriteButton";
import { BOOKING_STATUS, NOTIFICATION_STATUS, NOTIFICATION_TYPE, PAYMENT_STATUS } from "@/utils/constants";
import { LoadingButton } from "@/components/frontend";
import { useCards, usePropertySpace, usePublicUserData } from "@/hooks/api";
import useUserCurrentLocation from "@/hooks/api/useUserCurrentLocation";
import PropertySpaceMapImage from "@/components/frontend/PropertySpaceMapImage";
import { parseJsonSafely } from "@/utils/utils";
import moment from "moment";
import { AuthContext, tokenExpireError } from "@/authContext";
import PayBookingModal from "./PayBookingModal";
import { Elements, PaymentRequestButtonElement, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import SelectExistingCardsModal from "./SelectExistingCardsModal";

const statusMapping = ["Pending", "Upcoming", "Ongoing", "Completed", "Declined", "Canceled", "Expired"];
const statusColorMapping = ["text-white", "my-text-gradient", "text-[#667085]", "text-[#667085]", "text-[#D92D20]", "text-[#DC6803]", "text-[#D92D20] !bg-[#F2F4F7]"];

let sdk = new MkdSDK();
let ctrl = new AbortController();

export default function CustomerBookingDetailsPage() {
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { dispatch, state: authState } = useContext(AuthContext);

  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState({});
  const [paymentMethod, setPaymentMethod] = useState();
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [addReviewPopup, setAddReviewPopup] = useState(false);
  const showAddReviewPopup = useDelayUnmount(addReviewPopup, 100);
  const [checkedCount, setCheckedCount] = useState(0);
  const [availableHashtags, setAvailableHashtags] = useState([{ name: "Test", id: 12 }]);
  const [render, forceRender] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [newCardPaymentModal, setNewCardPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState(undefined);
  const [paymentOptions, setPaymentOptions] = useState(false);
  const [existingCardsModal, setExistingCardsModal] = useState(false);
  const { cards } = useCards({ loader: false });

  const stripePromise = loadStripe(import.meta.env.VITE_REACT_STRIPE_PUBLIC_KEY);

  const bookingExpired = booking.booking_start_time && booking.status < BOOKING_STATUS.ONGOING ? new Date(booking.booking_start_time) < Date.now() : false;

  const { register, handleSubmit, watch, reset } = useForm();
  const ratingVal = watch("rating");
  const hostRatingVal = watch("host_rating");
  const hashtags = watch("hashtags", []);

  const [declinePopup, setDeclinePopup] = useState(false);
  const showDeclinePopup = useDelayUnmount(declinePopup, 300);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (Array.isArray(hashtags)) {
      setCheckedCount(hashtags?.filter(Boolean).length);
    }
  }, [hashtags]);

  const otherUserData = usePublicUserData(booking.host_id);
  const { propertySpace } = usePropertySpace(booking.property_space_id, render);

  async function addHashTagToReview(hashtags, reviewId) {
    try {
      sdk.setTable("review_hashtag");
      hashtags.map((hashtag) =>
        sdk.callRestAPI(
          {
            hashtag_id: hashtag,
            review_id: reviewId,
          },
          "POST",
        ),
      );
      await Promise.all(hashtags);
    } catch (error) {
      console.log("Error", error);
    }
  }

  const onSubmit = async (data) => {
    console.log("submitting", data);
    setLoading(true);
    let newReview = {
      customer_id: booking.customer_id,
      host_id: booking.host_id,
      property_spaces_id: booking.property_space_id,
      property_name: booking.property_name,
      booking_id: booking.id,
      comment: data.comment,
      customer_rating: null,
      host_rating: data.host_rating,
      space_rating: data.rating,
      post_date: new Date().toISOString(),
      given_by: "customer",
      received_by: "host",
    };
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/review/POST", newReview, "POST", ctrl.signal);
      await addHashTagToReview(data.hashtags, result.message);

      // create notification
      sdk.setTable("notification");
      await sdk.callRestAPI(
        {
          user_id: Number(localStorage.getItem("user")),
          actor_id: null,
          action_id: result.message,
          notification_time: new Date().toISOString().split(".")[0],
          message: "New Review Added",
          type: NOTIFICATION_TYPE.ADD_REVIEW,
          status: NOTIFICATION_STATUS.NOT_ADDRESSED,
        },
        "POST",
      );
      setLoading(false);

      setAddReviewPopup(false);

      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: {
          heading: "Success",
          message: "Review added successful",
          btn: "Ok got it",
        },
      });
      reset();
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") {
        setLoading(false);
        return;
      }
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    setLoading(false);
  };

  async function fetchBooking(booking_id) {
    globalDispatch({ type: "START_LOADING" });
    const where = [`ergo_booking.id = ${booking_id} AND ergo_booking.deleted_at IS NULL`];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/booking/details", { where }, "POST", ctrl.signal);
      setBooking(result.list ?? {});

      return result.list ?? {}
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") {
        globalDispatch({ type: "STOP_LOADING" });
        return;
      }
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    finally {
      globalDispatch({ type: "STOP_LOADING" });
    }
  }

  async function fetchHashtags() {
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/hashtag/PAGINATE",
        {
          page: 1,
          limit: 1000,
          where: [`ergo_hashtag.deleted_at IS NULL`],
        },
        "POST",
        ctrl.signal,
      );
      if (Array.isArray(result.list)) {
        setAvailableHashtags(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") return;
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  async function cancelBooking(id) {
    const payload = {
      id,
      booked_unit: 1,
      status: BOOKING_STATUS.CANCELLED,
    };
    try {
      await sdk.callRawAPI("/v2/api/custom/ergo/booking/PUT", payload, "POST", ctrl.signal);
      if (booking.status === BOOKING_STATUS.UPCOMING) {
        await sdk.callRawAPI("/v2/api/custom/ergo/refund", { booking_id: booking.id, stripe_payment_intent_id: booking.stripe_payment_intent_id }, "POST");
      } else {
        await sdk.callRawAPI("/v2/api/custom/ergo/capture", { booking_id: booking.id, status: 5, stripe_payment_intent_id: booking.stripe_payment_intent_id }, "POST");
      }
      sendCancelEmail(booking.host_id, booking.property_name, `from ${moment(booking.booking_start_time).format("MM/DD/YYYY")} to ${moment(booking.booking_end_time).format("MM/DD/YYYY")}`, reason);
      fetchBooking(id);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") return;
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }
  async function deleteBooking(id) {
    const payload = {
      id,
    };
    try {
      sdk.setTable("booking")
      const result = await sdk.callRestAPI(payload, "DELETE", ctrl.signal);
      showToast(globalDispatch, result.message, 5000)
      navigate("/account/my-bookings")
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      if (err.name == "AbortError") return;
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
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/get-user", { id }, "POST", ctrl.signal);
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

  async function remindHost() {
    try {
      const tmpl = await sdk.getEmailTemplate("pending-booking-reminder");
      let time = `from ${moment(booking.booking_start_time).format("MM/DD/YYYY")} to ${moment(booking.booking_end_time).format("MM/DD/YYYY")}`;

      const body = tmpl.html
        ?.replace(new RegExp("{{{space_name}}}", "g"), booking.property_name)
        .replace(new RegExp("{{{time}}}", "g"), time)
        .replace(new RegExp("{{{booking_id}}}", "g"), booking.id)
        .replace(new RegExp("{{{customer_name}}}", "g"), `${booking.customer_first_name} ${booking.customer_last_name}`);
      await sdk.sendEmail(booking.host_email, tmpl.subject, body);

      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: {
          heading: "Email sent",
          message: "Email sent to host",
          btn: "Ok got it",
        },
      });
    } catch (err) {
      tokenExpireError(dispatch, err.message);
    }
  }

  useEffect(() => {
    fetchBooking(id)
  }, [])

  useEffect(() => {
    (async () => {
      fetchHashtags()
    })();
  }, [])

  const { latitude, longitude, done } = useUserCurrentLocation();

  return (
    <div className="text-sm normal-case md:text-base">
      <div>
        <button
          type="button"
          onClick={() => navigate("/account/my-bookings")}
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
        <h1 className="mr-3 mb-[24px] text-3xl font-semibold text-[#101828] md:mb-0">Booking - {booking.property_name}</h1>
        <div className="flex items-center gap-[16px]">
          <h4 className="font-semibold">Status</h4>
          <span
            className={`${booking.status == BOOKING_STATUS.PENDING ? "bg-[#1D2939]" : "bg-[#F2F4F7]"} rounded-sm px-[16px] py-[8px] ${statusColorMapping[bookingExpired ? 6 : booking.status ?? 0]
              } border text-sm font-semibold uppercase`}
          >
            {" "}
            {statusMapping[bookingExpired ? 6 : booking.status ?? 0]}
          </span>
          <div className="flex flex-grow justify-end">
            <div className={` "border p-1 px-2 md:border-0"`}>
              <ThreeDotsMenu
                items={[
                  {
                    label: "Delete booking",
                    icon: <></>,
                    onClick: () => deleteBooking(booking.id),
                    notShow: booking.status == BOOKING_STATUS.ONGOING || booking.status == BOOKING_STATUS.UPCOMING,
                  },
                  {
                    label: "Cancel booking",
                    icon: <></>,
                    onClick: () => cancelBooking(booking.id),
                    notShow: booking.status == BOOKING_STATUS.COMPLETED || booking.status == BOOKING_STATUS.ONGOING || bookingExpired || booking.status == BOOKING_STATUS.CANCELLED,
                  },
                  {
                    label: "Edit booking",
                    icon: <></>,
                    onClick: () => navigate("/account/my-bookings/edit/" + booking.id),
                    notShow: booking.status > BOOKING_STATUS.UPCOMING || bookingExpired,
                  },
                  {
                    label: "Add a review",
                    icon: <></>,
                    onClick: () => setAddReviewPopup(true),
                    notShow: booking.status != BOOKING_STATUS.COMPLETED || bookingExpired,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-start md:gap-[24px]">
        <div className="w-full md:w-[55%]">
          {(!bookingExpired && booking.status != BOOKING_STATUS.CANCELLED) &&
            <div className="mb-[32px] rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-[20px] py-[16px]">
              <div className="flex items-start gap-[12px]">
                <NoteIcon width={60} />
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">What's next</h3>
                  <p className="text-[#667085]">
                    You booking has been sent to the host and will be reviewed within 2 hours. If you don’t hear form the host withing 2h you can cancel your booking or reach out to them via{" "}
                    <Link
                      className="font-semibold underline"
                      to={`/account/messages?other_user_id=${booking.host_id}&booking=${booking.id}&space=${booking.property_space_id}`}
                    >
                      Messages
                    </Link>{" "}
                  </p>
                </div>
              </div>
            </div>
          }
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
                <strong>{formatAMPM(booking.booking_start_time ?? "01/01/01")}</strong>{" "}
              </div>
              <div className="flex gap-[10px]">
                <DateTimeIcon />
                <p className="text-lg">Until</p>
                <strong>{formatAMPM(booking.booking_end_time ?? "01/01/01")}</strong>
              </div>
            </div>
          </div>
          <div className="mb-6 flex items-center justify-between">
            <li className="text-xl font-semibold">Space: </li>
            {booking.status == BOOKING_STATUS.COMPLETED ? (
              <button
                className="bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pr-4 font-bold text-transparent"
                onClick={() => {
                  setAddReviewPopup(true);
                }}
              >
                Add Review
              </button>
            ) : null}
          </div>
          <div className="mb-[32px] flex max-w-full flex-col rounded-lg border border-[#EAECF0] bg-[#F9FAFB] lg:h-[167px] lg:w-[unset] lg:flex-row lg:gap-[32px]">
            <div
              className="mb-[8px] flex h-[180px] w-full flex-col rounded-lg bg-cover bg-center bg-no-repeat px-[10px] pb-[13px] lg:h-full lg:w-[262px]"
              style={{ backgroundImage: `url(${booking.image_url ?? "/default-property.jpg"})` }}
            >
              <FavoriteButton
                space_id={propertySpace.id}
                user_property_spaces_id={propertySpace.user_property_spaces_id}
                reRender={forceRender}
                withLoader={true}
              />
            </div>
            <div className="flex flex-grow items-end justify-between py-6 pl-4 pr-4 lg:items-start lg:pl-0 lg:pr-8">
              <div className="">
                <h2 className="mb-[6px] text-[18px] font-semibold">{booking.property_name}</h2>
                <p className="max-w-[250px] truncate text-sm tracking-wider text-[#475467]">
                  {[BOOKING_STATUS.UPCOMING, BOOKING_STATUS.ONGOING].includes(booking.status) ? propertySpace.address_line_1 : propertySpace.city}
                </p>
                <p className="max-w-[250px] truncate text-sm tracking-wider text-[#475467]">
                  {[BOOKING_STATUS.UPCOMING, BOOKING_STATUS.ONGOING].includes(booking.status) ? propertySpace.address_line_2 : propertySpace.country}
                </p>
                <div className="mt-[6px] flex lg:mt-[21px]">
                  <p className="mr-[31px]">
                    from: <span className="font-bold">${(Number(booking.hourly_rate) || 0).toFixed(2)}</span>/<span className="">day</span>
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
                  <strong className="font-semibold">
                    {(Number(propertySpace.average_space_rating) || 0).toFixed(1)}
                    <span className="font-normal">({propertySpace.space_rating_count})</span>
                  </strong>
                </p>
                {[BOOKING_STATUS.COMPLETED, BOOKING_STATUS.ONGOING, BOOKING_STATUS.UPCOMING].includes(booking.status) ? (
                  <a
                    href={
                      true
                        ? `https://www.google.com/maps/dir/?api=1&origin=${latitude + "," + longitude}&destination=${propertySpace.address_line_1 + ", " + propertySpace.address_line_2 + " " + propertySpace.city + " " + propertySpace.country
                        }`
                        : `https://www.google.com/maps/search/?api=1&query=${propertySpace.city + ", " + propertySpace.country}`
                    }
                    target="_blank"
                    className="hidden whitespace-nowrap text-xs text-[#475467] underline lg:inline"
                  >
                    (view on map)
                  </a>
                ) : (
                  <button
                    className="whitespace-nowrap text-sm underline"
                    target="_blank"
                    onClick={(e) => {
                      setShowMap(true);
                    }}
                  >
                    (view on map)
                  </button>
                )}
              </div>
            </div>
          </div>
          {booking.add_ons !== undefined && booking?.add_ons?.length > 0 &&
            <li className="mb-6 text-xl font-semibold">Add-ons:</li>
          }
          <div className="addons-grid list-disk-important">
            {(booking.add_ons ?? []).map((addon, idx) => (
              <div
                className="flex gap-[14px]"
                key={idx}
              >
                <CircleCheckIcon />
                <p>{addon.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-full flex-grow">
          <div className="mb-[32px] rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-[20px] py-[24px]">
            <h3 className="mb-[8px] font-semibold md:text-2xl">Your Host</h3>
            <div className="flex flex-wrap items-center justify-between">
              <div className="mb-4 flex items-center gap-4">
                <img
                  src={otherUserData.photo || "/default.png"}
                  className="h-[48px] w-[48px] rounded-full object-cover"
                />
                <p className="font-semibold md:text-xl">{(booking.host_first_name ?? "") + " " + (booking.host_last_name ?? "")}</p>
              </div>
              <Link
                className="my-text-gradient whitespace-nowrap rounded-md border border-[#33D4B7] px-4 py-2 text-center text-sm font-semibold md:w-[158px]"
                disabled={booking.id == undefined}
                to={`/account/messages?other_user_id=${booking.host_id}&booking=${booking.id}&space=${booking.property_space_id}`}
              >
                Chat with Host
              </Link>
            </div>

            {booking.status == BOOKING_STATUS.PENDING && (
              <div className="mt-4 flex items-center">
                <p>
                  <button
                    className="font-semibold underline"
                    onClick={remindHost}
                  >
                    Remind
                  </button>{" "}
                  host via email to review your booking
                </p>
              </div>
            )}
          </div>
          <div className="mb-[16px] rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-[20px] md:p-[32px]">
            <div className="flex items-center">
              <h4 className="mb-[8px] text-2xl font-semibold">Charges</h4>
              {booking.payment_status === PAYMENT_STATUS.SUCCESSFUL &&
                <span type="button" className="mb-[8px] ml-5 block login-btn-gradient text-white rounded-md px-8 py-2 font-semibold hover:cursor-default">Paid</span>
              }
            </div>
            <p className="mb-[16px] text-sm text-[#667085]">(funds will be put on hold, pending when host accepts/rejects your booking)</p>
            <div className="mb-[12px] flex justify-between">
              <p>Rate</p>
              <p className="font-semibold text-[#344054]"> ${(booking.hourly_rate || 0).toFixed(2)}</p>
            </div>
            <div className="mb-[12px] flex justify-between">
              <p>Price</p>
              <p className="font-semibold text-[#344054]"> ${(booking.hourly_rate * (booking.duration / 3600) || 0).toFixed(2)}</p>
            </div>
            {(booking.add_ons ?? []).map((addon) => (
              <div
                className="mb-[12px] flex justify-between"
                key={addon.id}
              >
                <p>{addon.name}</p>
                <p className="font-semibold text-[#344054]"> ${(addon.cost || 0).toFixed(2)}</p>
              </div>
            ))}

            <div className="mb-[16px] flex justify-between">
              <p>Tax</p>
              <p className="font-semibold text-[#344054]"> ${(booking.tax || 0).toFixed(2)}</p>
            </div>
            <div className="-mx-3 mb-[12px] flex justify-between bg-black p-3 font-bold text-white">
              <p>Total</p>
              <p> {booking.payment_status == PAYMENT_STATUS.SUCCESSFUL && (<span className="mr-2 bg-green-600 text-white rounded-full font-semibold px-4">Paid</span>)} ${(booking.total || 0).toFixed(2)}</p>
            </div>
          </div>
          <Link
            to={"/help/cancellation-policy"}
            target="_blank"
            className="block mb-6 text-center font-semibold text-[#667085] underline"
          >
            Cancellation policy
          </Link>
        </div>
      </div>
      {showAddReviewPopup && (
        <div
          className="popup-container flex items-center justify-center normal-case"
          onClick={() => setAddReviewPopup(false)}
        >
          <form
            className={`${addReviewPopup ? "pop-in" : "pop-out"} w-[510px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Leave a review</h3>
              <button
                type="button"
                onClick={() => setAddReviewPopup(false)}
                className="rounded-full border p-1 px-3 text-2xl font-normal duration-100 hover:bg-gray-200 active:bg-gray-300"
              >
                &#x2715;
              </button>
            </div>
            <p className="mb-[16px] text-sm text-[#475467]">You have completed your booking! Leave a review to let others know about your experience with the space and the host.</p>
            <div>
              <h4 className="mb-[8px] text-xl font-semibold">Select rating</h4>
              <div className="select-rating-container mb-[24px] flex gap-4">
                {[1, 2, 3, 4, 5].map((val) => (
                  <label htmlFor={"rating_" + val}>
                    <input
                      type="radio"
                      {...register("rating")}
                      value={val}
                      id={"rating_" + val}
                    />
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill={!ratingVal || ratingVal < val ? "none" : "#33D4B7"}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.1614 16.3677L13.7068 16.1595C13.6543 16.274 13.5845 16.3632 13.4966 16.4344C13.4273 16.4905 13.3479 16.524 13.2431 16.5331C13.1667 16.5398 13.0863 16.5237 12.9876 16.4582L12.9877 16.4581L12.9771 16.4515L8.82711 13.8473L8.56135 13.6805L8.29559 13.8473L4.14559 16.4515L4.1455 16.4513L4.13509 16.4582C4.03641 16.5237 3.956 16.5398 3.87959 16.5331C3.7748 16.524 3.69535 16.4905 3.6261 16.4344C3.53833 16.3633 3.46858 16.2743 3.41616 16.16C3.38464 16.0908 3.36936 15.9998 3.39942 15.8638C3.39945 15.8636 3.39948 15.8635 3.39951 15.8634L4.49931 10.9424L4.56306 10.6572L4.34582 10.4617L0.675047 7.15819C0.576587 7.06488 0.531828 6.97672 0.514002 6.89047L0.514006 6.89047L0.513604 6.88857C0.490262 6.7778 0.497009 6.67532 0.533413 6.57104C0.576075 6.44883 0.633362 6.3661 0.698165 6.30703C0.737553 6.27113 0.815759 6.22473 0.972179 6.19965L5.8068 5.75835L6.11051 5.73062L6.22487 5.44791L8.09987 0.812492L8.10059 0.810696C8.1474 0.693678 8.20855 0.628401 8.27973 0.586111L8.28045 0.585682C8.38637 0.522513 8.4778 0.5 8.56135 0.5C8.64484 0.5 8.73672 0.522488 8.84348 0.585824C8.91401 0.627946 8.97513 0.693252 9.02211 0.810696L9.02283 0.81249L10.8978 5.44791L11.0122 5.73062L11.3159 5.75835L16.1505 6.19965C16.3069 6.22473 16.3851 6.27113 16.4245 6.30703C16.4893 6.3661 16.5466 6.44883 16.5893 6.57105C16.6258 6.67572 16.6328 6.7786 16.6099 6.88955C16.5915 6.97634 16.5462 7.06483 16.4477 7.15818L12.7769 10.4617L12.5596 10.6572L12.6234 10.9424L13.7232 15.8634C13.7232 15.8635 13.7232 15.8636 13.7233 15.8637C13.7534 15.9999 13.738 16.0909 13.7065 16.1602L14.1614 16.3677ZM14.1614 16.3677C14.2447 16.1851 14.2613 15.9809 14.2113 15.7552L2.96135 16.3677C3.04468 16.5497 3.16135 16.7014 3.31135 16.8229C3.46135 16.9444 3.63635 17.0139 3.83635 17.0312C4.03635 17.0486 4.22802 16.9965 4.41135 16.875L8.56135 14.2708L12.7113 16.875C12.8947 16.9965 13.0864 17.0486 13.2864 17.0312C13.4864 17.0139 13.6614 16.9444 13.8113 16.8229C13.9613 16.7014 14.078 16.5497 14.1614 16.3677Z"
                        stroke={!ratingVal || ratingVal < val ? "#98A2B3" : "#33D4B7"}
                      />
                    </svg>
                  </label>
                ))}
              </div>
              <>
                <h4 className="mb-[8px] text-xl font-semibold">Host rating</h4>
                <div className="select-rating-container mb-[24px] flex gap-4">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <label htmlFor={"host_rating_" + val}>
                      <input
                        type="radio"
                        {...register("host_rating")}
                        value={val}
                        id={"host_rating_" + val}
                      />
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill={!hostRatingVal || hostRatingVal < val ? "none" : "#33D4B7"}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14.1614 16.3677L13.7068 16.1595C13.6543 16.274 13.5845 16.3632 13.4966 16.4344C13.4273 16.4905 13.3479 16.524 13.2431 16.5331C13.1667 16.5398 13.0863 16.5237 12.9876 16.4582L12.9877 16.4581L12.9771 16.4515L8.82711 13.8473L8.56135 13.6805L8.29559 13.8473L4.14559 16.4515L4.1455 16.4513L4.13509 16.4582C4.03641 16.5237 3.956 16.5398 3.87959 16.5331C3.7748 16.524 3.69535 16.4905 3.6261 16.4344C3.53833 16.3633 3.46858 16.2743 3.41616 16.16C3.38464 16.0908 3.36936 15.9998 3.39942 15.8638C3.39945 15.8636 3.39948 15.8635 3.39951 15.8634L4.49931 10.9424L4.56306 10.6572L4.34582 10.4617L0.675047 7.15819C0.576587 7.06488 0.531828 6.97672 0.514002 6.89047L0.514006 6.89047L0.513604 6.88857C0.490262 6.7778 0.497009 6.67532 0.533413 6.57104C0.576075 6.44883 0.633362 6.3661 0.698165 6.30703C0.737553 6.27113 0.815759 6.22473 0.972179 6.19965L5.8068 5.75835L6.11051 5.73062L6.22487 5.44791L8.09987 0.812492L8.10059 0.810696C8.1474 0.693678 8.20855 0.628401 8.27973 0.586111L8.28045 0.585682C8.38637 0.522513 8.4778 0.5 8.56135 0.5C8.64484 0.5 8.73672 0.522488 8.84348 0.585824C8.91401 0.627946 8.97513 0.693252 9.02211 0.810696L9.02283 0.81249L10.8978 5.44791L11.0122 5.73062L11.3159 5.75835L16.1505 6.19965C16.3069 6.22473 16.3851 6.27113 16.4245 6.30703C16.4893 6.3661 16.5466 6.44883 16.5893 6.57105C16.6258 6.67572 16.6328 6.7786 16.6099 6.88955C16.5915 6.97634 16.5462 7.06483 16.4477 7.15818L12.7769 10.4617L12.5596 10.6572L12.6234 10.9424L13.7232 15.8634C13.7232 15.8635 13.7232 15.8636 13.7233 15.8637C13.7534 15.9999 13.738 16.0909 13.7065 16.1602L14.1614 16.3677ZM14.1614 16.3677C14.2447 16.1851 14.2613 15.9809 14.2113 15.7552L2.96135 16.3677C3.04468 16.5497 3.16135 16.7014 3.31135 16.8229C3.46135 16.9444 3.63635 17.0139 3.83635 17.0312C4.03635 17.0486 4.22802 16.9965 4.41135 16.875L8.56135 14.2708L12.7113 16.875C12.8947 16.9965 13.0864 17.0486 13.2864 17.0312C13.4864 17.0139 13.6614 16.9444 13.8113 16.8229C13.9613 16.7014 14.078 16.5497 14.1614 16.3677Z"
                          stroke={!hostRatingVal || hostRatingVal < val ? "#98A2B3" : "#33D4B7"}
                        />
                      </svg>
                    </label>
                  ))}
                </div>
              </>

              <h4 className="mb-[8px] text-xl font-semibold">
                Select Hashtags <small className="text-xs font-normal text-gray-600">(max 3)</small>
              </h4>
              <div className="tiny-scroll mb-3 max-h-[150px] overflow-y-auto border p-4 text-sm">
                {availableHashtags.map((hash, i) => (
                  <div
                    className=" flex items-center gap-2 pb-4"
                    key={hash.id}
                  >
                    <input
                      type="checkbox"
                      {...register("hashtags")}
                      id={"hashtag_" + hash.id}
                      disabled={hashtags && checkedCount >= 3 && !hashtags.includes(hash.id.toString())}
                      value={hash.id}
                    />
                    <label
                      htmlFor={"hashtag_" + hash.id}
                      className="cursor-pointer"
                    >
                      {hash.name}
                    </label>
                  </div>
                ))}
              </div>
              <h4 className="mb-[8px] text-xl font-semibold">Comment</h4>
              <textarea
                {...register("comment")}
                cols="30"
                rows="5"
                className="w-full resize-none border p-3 text-sm focus:outline-none active:outline-none"
              ></textarea>
              <LoadingButton
                loading={loading}
                type="submit"
                className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"}  mt-4 w-full`}
              >
                Submit
              </LoadingButton>
            </div>
          </form>
        </div>
      )}
      <PropertySpaceMapImage
        modalImage={`https://maps.googleapis.com/maps/api/staticmap?center=${propertySpace.address_line_1 || ""}, ${propertySpace.address_line_2 || ""}, ${propertySpace.city || ""}, ${propertySpace.country || ""
          }&zoom=15&size=600x400&maptype=roadmap&markers=color:red|${propertySpace.address_line_1 || ""}, ${propertySpace.address_line_2 || ""}
      &key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
        modalOpen={showMap}
        closeModal={() => setShowMap(false)}
      />
      {showDeclinePopup && (
        <div
          className="popup-container flex items-center justify-center normal-case"
          onClick={() => setDeclinePopup(false)}
        >
          <div
            className={`${declinePopup ? "pop-in" : "pop-out"} w-[403px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Are you sure?</h3>
              <button
                className="rounded-full border p-1 px-3 text-2xl font-normal duration-100 hover:bg-gray-200 active:bg-gray-300"
                onClick={() => setDeclinePopup(false)}
              >
                &#x2715;
              </button>
            </div>
            <hr className="mb-4" />
            <p className="mb-[16px]">
              You are about to decline a booking from{" "}
              <b>
                {booking.customer_first_name} {booking.customer_last_name}
              </b>{" "}
              for <b>{booking.property_name} </b>on{" "}
              <b>{monthsMapping[new Date(booking.booking_start_time).getMonth()] + " " + new Date(booking.booking_start_time).getDate() + "/" + new Date(booking.booking_start_time).getFullYear()}</b>.
            </p>
            <h4 className="mb-[8px] text-xl font-semibold">Reason</h4>
            <textarea
              cols="30"
              rows="5"
              className="w-full resize-none border p-3 focus:outline-none active:outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
            <div className="flex gap-4">
              <button
                type="button"
                className="mt-4 flex-grow rounded border-2 border-[#98A2B3] py-2 tracking-wide outline-none focus:outline-none"
                onClick={() => setDeclinePopup(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mt-4 flex-grow rounded bg-[#D92D20] py-2 tracking-wide text-white  outline-none focus:outline-none"
                onClick={() => declineBooking(booking.id)}
              >
                Yes, decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
