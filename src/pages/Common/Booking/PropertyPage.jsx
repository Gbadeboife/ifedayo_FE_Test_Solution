import React, { useContext, useEffect } from "react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import FaqAccordion from "@/components/frontend/FaqAccordion";
import ReviewCard from "@/components/frontend/ReviewCard";

import StarIcon from "@/components/frontend/icons/StarIcon";
import MkdSDK from "@/utils/MkdSDK";
import { callCustomAPI } from "@/utils/callCustomAPI";
import DateTimePicker from "@/components/frontend/DateTimePicker";
import { useForm } from "react-hook-form";
import { useBookingContext } from "./bookingContext";
import CustomSelect from "@/components/frontend/CustomSelect";
import { GlobalContext } from "@/globalContext";
import FavoriteButton from "@/components/frontend/FavoriteButton";
import Counter from "@/components/frontend/Counter";
import { Tooltip } from "react-tooltip";
import { usePropertyAddons, usePropertySpace, usePropertySpaceImages, usePublicUserData, usePropertySpaceAmenities, usePropertySpaceFaqs, usePropertySpaceReviews } from "@/hooks/api";
import PropertyImageSlider from "@/components/frontend/PropertyImageSlider";
import PropertySpaceMapImage from "@/components/frontend/PropertySpaceMapImage";
import AllReviewsModal from "@/components/frontend/AllReviewsModal";
import { AuthContext } from "@/authContext";
import CircleCheckIcon from "@/components/frontend/icons/CircleCheckIcon";

let sdk = new MkdSDK();

const PropertyPage = () => {
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { state: authState, dispatch: authDispatch } = useContext(AuthContext);
  const { state: spaceData } = useLocation();
  const { bookingData, dispatch } = useBookingContext();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reviewsPopup, setReviewsPopup] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const bookingDetails = bookingData?.from === "" ? bookingData : JSON.parse(localStorage.getItem("booking_details"));
  const [reviewDirection, setReviewDirection] = useState("DESC");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [scheduleTemplate, setScheduleTemplate] = useState({});
  const [render, forceRender] = useState(false);
  const { handleSubmit, register, setValue } = useForm({
    defaultValues: bookingDetails,
  });

  const [showCalendar, setShowCalendar] = useState(false);

  const { propertySpace, notFound } = usePropertySpace(id, render);
  const hostData = usePublicUserData(propertySpace.host_id);
  const spaceImages = usePropertySpaceImages(propertySpace.id, true, setFetching);
  const spaceAddons = usePropertyAddons(propertySpace.property_id);
  const spaceAmenities = usePropertySpaceAmenities(propertySpace.id);
  const faqs = usePropertySpaceFaqs(propertySpace.id);
  const reviews = usePropertySpaceReviews(propertySpace.id);
  const [showMap, setShowMap] = useState(false);
  const { pathname } = useLocation();

  if (!fetching && spaceImages.length === 0) {
    navigate("*")
  }

  async function fetchBookedSlots(id) {
    try {
      const result = await callCustomAPI("customer/schedule", "post", { property_spaces_id: id }, "", null, "v3");
      if (Array.isArray(result.list)) {
        setBookedSlots(result.list);
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

  async function fetchScheduleTemplate(id) {
    try {
      const result = await callCustomAPI(
        "property_spaces_schedule_template",
        "post",
        {
          page: 1,
          limit: 1,
          where: [`property_spaces_id = ${id}`],
        },
        "PAGINATE",
      );
      if (Array.isArray(result.list) && result.list.length > 0) {
        setScheduleTemplate({ custom_slots: result.list[0].custom_slots });

      }
      if (result.list[0]?.schedule_template_id) {
        const templateResult = await callCustomAPI(
          "schedule_template",
          "post",
          {
            page: 1,
            limit: 1,
            where: [`id = ${result.list[0].schedule_template_id}`],
          },
          "PAGINATE",
        );
        if (Array.isArray(templateResult.list) && (templateResult.list[0] ?? {})) {
          setScheduleTemplate((prev) => {
            let updated = { ...prev, ...templateResult.list[0] };
            return updated;
          });
        }
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

  function switchToCustomer() {
    authDispatch({ type: "SWITCH_TO_CUSTOMER" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as a customer`,
        btn: "Ok got it",
      },
    });
  }

  const onSubmit = async (data) => {
    if (!authState.isAuthenticated) {
      navigate(`/login?redirect_uri=${pathname}`);
      return;
    }

    if (authState.user == propertySpace.host_id) {
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "error", message: "Owners can't book their own spaces" } })
      return
    }

    if (globalState.user.verificationStatus != 1) {
      globalDispatch({ type: "OPEN_NOT_VERIFIED_MODAL" });
      return;
    }
    dispatch({ type: "SET_BOOKING_DETAILS", payload: { ...data, ...propertySpace } });
    navigate("booking-preview");
  };

  useEffect(() => {
    if (isNaN(id)) return;
    fetchBookedSlots(id);
    fetchScheduleTemplate(id);

    // if (spaceImages.length === 0) {
    //   navigate("*")
    // }
  }, []);

  const sortByPostDate = (a, b) => {
    if (reviewDirection == "DESC") {
      return new Date(b.post_date) - new Date(a.post_date);
    }
    return new Date(a.post_date) - new Date(b.post_date);
  };

  if (notFound || isNaN(id)) return <Navigate to="/not-found" />;

  return (
    <div
      className="container mx-auto min-h-screen pt-[140px] text-sm normal-case md:text-base 2xl:px-16"
      onClick={() => {
        setShowCalendar(false);
      }}
    >
      <div className="mb-[18px] flex flex-col items-start justify-between px-[17px] md:flex-row md:items-center md:px-0">
        <div className="flex flex-col items-start gap-4 normal-case md:flex-row md:items-center">
          <h2 className="text-3xl font-semibold">{propertySpace.name ?? spaceData?.name}</h2>
          <button
            className="text-sm underline whitespace-nowrap"
            target="_blank"
            onClick={() => setShowMap(true)}
          >
            (view on map)
          </button>
        </div>
        <div className="mt-[19px] flex w-full justify-center gap-4 md:mt-0 md:w-[unset]">
          <p className="flex flex-grow items-center justify-center gap-2 rounded-sm border bg-[#F3F9F7] px-[14px] py-[10px]">
            <StarIcon />
            <strong className="font-semibold">
              {(Number(propertySpace.average_space_rating ?? spaceData?.average_space_rating) || 0).toFixed(1)}
              <span className="font-normal">({propertySpace.space_rating_count ?? spaceData?.space_rating_count})</span>
            </strong>
          </p>
          <div className="flex flex-grow items-center justify-center gap-2 rounded-sm border bg-[#F3F9F7] px-[14px] py-[10px]">
            <FavoriteButton
              space_id={propertySpace.id}
              user_property_spaces_id={propertySpace.user_property_spaces_id}
              reRender={forceRender}
              withLoader={true}
              className="-mb-1"
              buttonClassName=""
              stroke="#344054"
              favColor={"black"}
            />
            <span>Save</span>
          </div>
        </div>
      </div>
      <div className="snap-scroll relative mb-[66px] flex h-[381px] gap-[32px] px-[14px] md:px-0">
        {spaceImages[0]?.photo_url &&
          <img
            src={spaceImages[0]?.photo_url}
            className="h-full rounded-lg object-cover xl:min-w-[616px]"
          />
        }
        {spaceImages[1]?.photo_url &&
          <img
            src={spaceImages[1]?.photo_url}
            className="h-full w-[292px] rounded-lg object-cover"
          />
        }
        <div className={`${((!spaceImages[3]?.photo_url)) ? "flex min-w-[550px] flex-col" : "block"} "gap-4 overflow-hidden md:gap-[32px]"`}>
          {spaceImages[2]?.photo_url &&
            <img
              src={spaceImages[2]?.photo_url}
              className={`${spaceImages[3]?.photo_url && "h-1/2"} "rounded-lg object-cover md:w-full"`}
            />
          }
          {spaceImages[3]?.photo_url &&
            <img
              src={spaceImages[3]?.photo_url}
              className="object-cover rounded-lg h-1/2 md:w-full"
            />
          }
        </div>
        {spaceImages[4]?.photo_url &&
          <img
            src={spaceImages[4]?.photo_url}
            className="h-full w-[292px] rounded-lg object-cover"
          />
        }
        <button
          className="sticky right-6 mb-[8px] min-w-[170px] self-end border bg-[#00000080] px-3 py-1 text-center text-sm text-white"
          onClick={() => setGalleryOpen(true)}
        >
          View all photos ({spaceImages.length})
        </button>
      </div>
      <section className="relative flex flex-col items-start xl:flex-row xl:gap-12 lg:w-[90%] w-full mx-auto">
        <div className="w-full px-10 md:px-0 xl:w-3/5">
          <h3 className="mb-[8px] text-2xl font-semibold">Description</h3>
          <p className="">{propertySpace.description ?? spaceData?.description}</p>
          <hr className="my-[32px] md:my-[47px]" />
          <h3 className="mb-[8px] text-2xl font-semibold">Amenities</h3>
          <ul className="addons-grid list-disk-important">
            {spaceAmenities.map((am, idx) => (
              <li
                className="flex items-center gap-2 mb-4 w-fit sm:mb-0"
                key={idx}
              >
                <CircleCheckIcon />
                {am.amenity_name}
              </li>
            ))}
          </ul>
          <hr className="my-[32px] md:my-[47px]" />
          <h3 className="mb-[8px] text-2xl font-semibold">Add ons</h3>
          <ul className="addons-grid list-disk-important">
            {spaceAddons.map((addon) => (
              <li
                className="flex items-center gap-2 mb-4 w-fit sm:w-full sm:mb-0"
                key={addon.id}
              >
                <span className="w-fit">
                  {" "}
                  <div className="flex gap-4">
                    <CircleCheckIcon /> {addon.add_on_name}
                  </div>{" "}
                </span>{" "}
                <strong className="font-semibold">${addon.cost}/h</strong>
              </li>
            ))}
          </ul>
          <hr className="my-[32px] md:my-[47px]" />
          <div className="mb-[28px] flex flex-wrap items-center justify-between">
            <h3 className="mb-2 text-xl font-semibold md:mb-0 md:text-2xl">About the host</h3>
            {(authState.role == "customer" && propertySpace?.id) && (
              <Link
                to={`/account/messages?other_user_id=${propertySpace.host_id}&space=${propertySpace.id}`}
                className="my-text-gradient hidden w-[178px] whitespace-nowrap rounded-md border border-[#33D4B7] px-6 py-2 text-center font-semibold md:inline"
                id="contact-host"
              >
                Contact the host
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 md:justify-start md:gap-[24px]">
            <div className="w-max-content">
            <img
              src={hostData.photo ?? "/default.png"}
              className="h-[72px] w-[72px] rounded-full object-cover"
            />
            </div>
            <div className="space-y-3 w-[90%]">
              <p className="hidden text-xl font-bold md:block">{propertySpace.first_name}</p>
              <p className="hidden md:block">{propertySpace.about ?? spaceData?.about}</p>
            </div>
            {(authState.role == "customer" && propertySpace?.id) && (
              <Link
                to={`/account/messages?other_user_id=${propertySpace.host_id}&space=${propertySpace.id}`}
                className="my-text-gradient inline whitespace-nowrap rounded-md border border-[#33D4B7] px-4 py-1 text-center text-sm font-semibold md:hidden"
                id="contact-host"
              >
                Contact the host
              </Link>
            )}
          </div>
          <p className="block mt-4 md:hidden">{propertySpace.about ?? spaceData?.about}</p>

          <hr className="my-[32px] md:my-[47px]" />
          <div className="mb-[18px] flex items-center justify-between">
            <h3 className="mb-[8px] text-2xl font-semibold">Reviews</h3>
            <CustomSelect
              options={[
                { label: "By Date: Newest First", value: "DESC" },
                { label: "By Date: Oldest First", value: "ASC" },
              ]}
              onChange={setReviewDirection}
              accessor="label"
              valueAccessor="value"
              className="min-w-[200px]"
              listOptionClassName={"pl-4"}
            />
          </div>
          <section>
            {reviews.length == 0 && <p>No reviews yet</p>}
            {reviews
              .sort(sortByPostDate)
              .slice(0, 10)
              .map((rw) => (
                <ReviewCard
                  key={rw.id}
                  data={rw}
                />
              ))}
            <div className="text-center">
              {reviews.length > 10 ? (
                <button
                  className="font-semibold underline"
                  onClick={() => setReviewsPopup(true)}
                >
                  View more ({reviews.length})
                </button>
              ) : null}
            </div>
          </section>
          <hr className="my-[32px] md:my-[47px]" />
          <h3 className="mb-[8px] text-2xl font-semibold">FAQs</h3>
          {faqs.map((faq) => (
            <FaqAccordion
              key={faq.id}
              data={faq}
            />
          ))}
          <hr className="my-[32px] md:my-[47px]" />
          <h3 className="mb-4 text-2xl font-semibold">Property rules</h3>
          <p className="mb-32">{propertySpace.rule ?? spaceData?.rule}</p>
        </div>
        <div className="sticky bottom-0 hidden w-full flex-grow bg-white xl:top-16 xl:bottom-[unset] xl:block xl:w-[unset] ml-24">
          <div className="max-w-2xl p-6 mx-auto sticky-price-summary md:border-2">
            <h3 className="mb-[8px] text-2xl font-semibold">Price and availability</h3>
            <div className="mb-[13px] flex justify-between">
              <span className="text-lg">Max capacity</span>
              <span>
                {" "}
                <strong className="font-semibold">{propertySpace.max_capacity ?? spaceData?.max_capacity}</strong> people
              </span>
            </div>
            <div className="mb-[13px] flex justify-between">
              <span className="text-lg">Pricing from</span>
              <span>
                from: <strong className="font-semibold">${propertySpace.rate ?? spaceData?.rate}</strong>/h
              </span>
            </div>

            <form
              className="flex flex-col"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="mb-[13px] flex items-center justify-between">
                <span className="text-lg">Number of guests</span>
                <Counter
                  register={register}
                  name="num_guests"
                  setValue={setValue}
                  initialValue={bookingDetails.num_guests || 1}
                  maxCount={propertySpace.max_capacity ?? spaceData?.max_capacity}
                  minCount={1}
                />
              </div>
              <hr className="mb-[24px] hidden md:block" />
              <div className="z-50 mb-3">
                <DateTimePicker
                  register={register}
                  setValue={setValue}
                  fieldNames={["selectedDate", "from", "to"]}
                  showCalendar={showCalendar}
                  setShowCalendar={setShowCalendar}
                  fromDefault={bookingDetails.from}
                  toDefault={bookingDetails.to}
                  bookedSlots={bookedSlots.map((slot) => ({ fromTime: new Date(slot.start_time), toTime: new Date(slot.end_time) }))}
                  scheduleTemplate={scheduleTemplate}
                  defaultDate={bookingDetails.selectedDate || undefined}
                />
              </div>
              {authState.role != "customer" && authState.isAuthenticated ? (
                <button
                  type="button"
                  onClick={switchToCustomer}
                  className="gap-2 px-2 py-3 tracking-wide text-center text-white rounded-sm outline-none login-btn-gradient focus:outline-none"
                >
                  Join as customer to book
                </button>
              ) : (
                <button
                  type="submit"
                  id="proceed-to-preview"
                  className="gap-2 px-2 py-3 tracking-wide text-center text-white rounded-sm outline-none login-btn-gradient focus:outline-none"
                  disabled={(() => {
                    const el = document.getElementById("booking-time");
                    return !(el && !el.innerText.includes("Select"));
                  })()}
                >
                  {window.innerWidth > 500 ? "Continue" : "Continue to checkout"}
                </button>
              )}
            </form>
          </div>
        </div>
        <div className="block w-full max-w-xl p-6 mx-auto -mt-16 xl:hidden">
          <h3 className="mb-[8px] text-2xl font-semibold">Price and availability</h3>
          <div className="mb-[13px] flex justify-between">
            <span className="text-lg">Max capacity</span>
            <span>
              {" "}
              <strong className="font-semibold">{propertySpace.max_capacity ?? spaceData?.max_capacity}</strong> people
            </span>
          </div>
          <div className="mb-[13px] flex justify-between">
            <span className="text-lg">Pricing from</span>
            <span>
              from: <strong className="font-semibold">${propertySpace.rate ?? spaceData?.rate}</strong>/h
            </span>
          </div>

          <form
            className="flex flex-col"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="mb-[13px] flex items-center justify-between">
              <span className="text-lg">Number of guests</span>
              <Counter
                register={register}
                name="num_guests"
                setValue={setValue}
                initialValue={bookingDetails.num_guests || 1}
                maxCount={propertySpace.max_capacity ?? spaceData?.max_capacity}
                minCount={1}
              />
            </div>
            <hr className="mb-[24px] hidden md:block" />
            <div className="z-50 mb-3">
              <DateTimePicker
                register={register}
                setValue={setValue}
                fieldNames={["selectedDate", "from", "to"]}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                fromDefault={bookingDetails.from}
                toDefault={bookingDetails.to}
                bookedSlots={bookedSlots.map((slot) => ({ fromTime: new Date(slot.start_time), toTime: new Date(slot.end_time) }))}
                scheduleTemplate={scheduleTemplate}
              />
            </div>
            {authState.role != "customer" && authState.isAuthenticated ? (
              <button
                type="button"
                onClick={switchToCustomer}
                className="gap-2 px-2 py-3 tracking-wide text-center text-white rounded-sm outline-none login-btn-gradient focus:outline-none"
              >
                Join as customer to book
              </button>
            ) : (
              <button
                type="submit"
                id="proceed-to-preview"
                className="gap-2 px-2 py-3 tracking-wide text-center text-white rounded-sm outline-none login-btn-gradient focus:outline-none"
                disabled={(() => {
                  const els = document.querySelectorAll("#booking-time");
                  return Array.from(els).every((el) => el.innerText.includes("Select"));
                })()}
              >
                {window.innerWidth > 500 && "Continue"}
                {window.innerWidth < 500 && "Continue to checkout"}
              </button>
            )}
          </form>
        </div>
      </section>
      <PropertyImageSlider
        spaceImages={spaceImages}
        modalOpen={galleryOpen}
        closeModal={() => setGalleryOpen(false)}
      />
      <AllReviewsModal
        modalOpen={reviewsPopup}
        closeModal={() => setReviewsPopup(false)}
        reviews={reviews}
        onDirectionChange={setReviewDirection}
      />
      <Tooltip
        anchorId="proceed-to-preview"
        place="bottom"
        content={"Proceed to book"}
        noArrow
      />
      <Tooltip
        anchorId="contact-host"
        place="bottom"
        content={"Chat with Host"}
        noArrow
      />
      <PropertySpaceMapImage
        modalImage={`https://maps.googleapis.com/maps/api/staticmap?center=${propertySpace.address_line_1 ?? ""},${propertySpace.address_line_2 ?? ""},${propertySpace.city ?? ""},${propertySpace.country ?? ""
          }&zoom=15&size=600x400&maptype=roadmap&markers=color:red|${propertySpace.address_line_1 ?? ""},${propertySpace.address_line_2 ?? ""}
      &key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
        modalOpen={showMap}
        closeModal={() => setShowMap(false)}
      />
    </div>
  );
};

export default PropertyPage;
