import React, { Fragment, useEffect } from "react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import FaqAccordion from "@/components/frontend/FaqAccordion";
import ReviewCard from "@/components/frontend/ReviewCard";
import StarIcon from "@/components/frontend/icons/StarIcon";
import MkdSDK from "@/utils/MkdSDK";
import { callCustomAPI } from "@/utils/callCustomAPI";
import DateTimePicker from "@/components/frontend/DateTimePicker";
import { useForm } from "react-hook-form";
import Icon from "@/components/Icons";
import ThreeDotsMenu from "@/components/frontend/ThreeDotsMenu";
import MySpaceBookingHistoryPage from "./MySpaceBookingHistoryPage";
import CustomSelect from "@/components/frontend/CustomSelect";
import DraftProgress from "@/components/frontend/DraftProgress";
import { DRAFT_STATUS, IMAGE_STATUS, SPACE_VISIBILITY } from "@/utils/constants";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import FavoriteButton from "@/components/frontend/FavoriteButton";
import PropertyImageSlider from "@/components/frontend/PropertyImageSlider";
import { usePropertyAddons, usePropertySpace, usePropertySpaceAmenities, usePropertySpaceFaqs, usePropertySpaceImages, usePropertySpaceReviews, usePublicUserData } from "@/hooks/api";
import PropertySpaceMapImage from "@/components/frontend/PropertySpaceMapImage";
import { Tab } from "@headlessui/react";
import AllReviewsModal from "@/components/frontend/AllReviewsModal";
import CircleCheckIcon from "@/components/frontend/icons/CircleCheckIcon";
import DeleteSpaceConfirmation from "./DeleteSpaceConfirmation";
import { AuthContext, tokenExpireError } from "@/authContext";
import useAmenityCategories from "@/hooks/api/useAmenityCategories";
import usePropertySpaceImagesV2 from "@/hooks/api/usePropertySpaceImagesV2";

let sdk = new MkdSDK();
let ctrl = new AbortController();

const statusMapping = ["Under Review", "Active", "Rejected"];
const statusColorMapping = ["text-[#DC6803]", "my-text-gradient", "text-[#D92D20]"];

const MySpaceDetailsPage = () => {
  const { state: spaceData } = useLocation();
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reviewsPopup, setReviewsPopup] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [reviewDirection, setReviewDirection] = useState("DESC");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [scheduleTemplate, setScheduleTemplate] = useState({});
  const [myBookings, setMyBookings] = useState([]);

  const { handleSubmit, register, setValue } = useForm();

  const [showCalendar, setShowCalendar] = useState(false);
  const [render, forceRender] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [fetching, setFetching] = useState(true);


  const { propertySpace, notFound } = usePropertySpace(id, render);
  const hostData = usePublicUserData(propertySpace.host_id);
  const spaceImages = usePropertySpaceImagesV2(propertySpace.id, false,);
  const spaceAddons = usePropertyAddons(propertySpace.property_id);
  const spaceAmenities = usePropertySpaceAmenities(propertySpace.id);

  const faqs = usePropertySpaceFaqs(propertySpace.id);
  const reviews = usePropertySpaceReviews(propertySpace.id);
  const [deleteSpace, setDeleteSpace] = useState(false);


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
        setScheduleTemplate({ custom_slots: result.list[0].custom_slots, schedule_id: result.list[0].id });
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

  async function fetchMySpaceBookings() {
    const user_id = localStorage.getItem("user");
    var where = [`ergo_booking.host_id = ${user_id} AND ergo_booking.property_space_id = ${id} AND ergo_booking.deleted_at IS NULL`];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/booking/PAGINATE", { page: 1, limit: 10000, where }, "POST", ctrl.signal);
      if (Array.isArray(result.list)) {
        setMyBookings(result.list);
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

  async function hidePropertySpace(id) {
    globalDispatch({ type: "START_LOADING" });
    try {
      await sdk.callRawAPI("/rest/property_spaces/PUT", { id, availability: SPACE_VISIBILITY.HIDDEN }, "POST", ctrl.signal);
      forceRender(new Date());
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
    globalDispatch({ type: "STOP_LOADING" });
  }

  async function showPropertySpace(id) {
    globalDispatch({ type: "START_LOADING" });
    try {
      await sdk.callRawAPI("/rest/property_spaces/PUT", { id, availability: SPACE_VISIBILITY.VISIBLE }, "POST", ctrl.signal);
      forceRender(new Date());
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
    globalDispatch({ type: "STOP_LOADING" });
  }

  const onSubmit = async (data) => {
    console.log("submitting ", data);
  };

  useEffect(() => {
    fetchBookedSlots(id);
    fetchScheduleTemplate(id);
    fetchMySpaceBookings();
  }, []);

  const sortByPostDate = (a, b) => {
    if (reviewDirection == "DESC") {
      return new Date(b.post_date) - new Date(a.post_date);
    }
    return new Date(a.post_date) - new Date(b.post_date);
  };

  if (notFound) return <Navigate to={"/not-found"} />;

  return (
    <div
      className="-mt-2 text-sm normal-case md:-mt-10 md:text-base"
      onClick={() => {
        setShowCalendar(false);
      }}
    >
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
      <div className="mb-[22px] flex items-center justify-between">
        <h1 className="mr-3 text-2xl font-semibold text-[#101828] md:text-3xl">Space Details</h1>
        <div className="flex items-center gap-[16px]">
          <span className={`${"bg-[#F2F4F7]"} rounded-sm px-[16px] py-[8px] ${statusColorMapping[propertySpace.space_status ?? spaceData?.space_status ?? 0]} border text-sm font-semibold uppercase`}>
            {" "}
            {(propertySpace.draft_status ?? spaceData?.draft_status) < DRAFT_STATUS.COMPLETED ? "DRAFT" : statusMapping[propertySpace.space_status ?? spaceData?.space_status ?? 0]}
          </span>
          <button onClick={() => setDeleteSpace(true)} className={`${(propertySpace.draft_status ?? spaceData?.draft_status) < DRAFT_STATUS.COMPLETED ? 'block' : 'hidden'}`}>Delete draft</button>
          <ThreeDotsMenu
            disabled={(propertySpace.draft_status ?? spaceData?.draft_status) < DRAFT_STATUS.COMPLETED}
            hidden={(propertySpace.draft_status ?? spaceData?.draft_status) < DRAFT_STATUS.COMPLETED}
            items={[
              {
                label: "Activate Space",
                icon: <></>,
                onClick: () => showPropertySpace(propertySpace.id),
                notShow: (propertySpace.space_status ?? spaceData?.space_status) == 0 || (propertySpace.availability ?? spaceData?.availability) == 1,
              },
              {
                label: "Deactivate Space",
                icon: <></>,
                onClick: () => hidePropertySpace(propertySpace.id),
                notShow: (propertySpace.availability ?? spaceData?.availability) == 0,
              },
              {
                label: "Edit Scheduling",
                icon: <></>,
                onClick: () => {
                  navigate(`/account/my-spaces/${id}/edit-scheduling?mode=edit`, { state: scheduleTemplate });
                },
              },
              {
                label: "Edit Images, FAQs",
                icon: <></>,
                onClick: () => {
                  navigate(`/account/my-spaces/${id}/edit-images?mode=edit`);
                },
              },
              {
                label: "Edit Space Details",
                icon: <></>,
                onClick: () => {
                  navigate(`/account/my-spaces/${id}/edit-property-space?mode=edit`);
                },
              },
              {
                label: "Delete",
                icon: <></>,
                onClick: () => setDeleteSpace(true),
              },
            ]}
          />
        </div>
      </div>
      <Tab.Group>
        <Tab.List
          as={"div"}
          className="two-tab-menu mb-[32px] border-b"
        >
          <Tab as={Fragment}>
            <button className={`py-3 px-4 text-xl focus:outline-none ui-selected:font-semibold`}>Space Listing</button>
          </Tab>{" "}
          <Tab as={Fragment}>
            <button className={`py-3 px-4 text-xl focus:outline-none ui-selected:font-semibold`}>Booking History</button>
          </Tab>{" "}
          <div className="mover"></div>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel as={Fragment}>
            <div className={"block"}>
              {propertySpace.id ?? spaceData?.id ? (
                <>
                  {" "}
                  {(propertySpace.draft_status ?? spaceData?.draft_status) < DRAFT_STATUS.COMPLETED ? (
                    <>
                      <p className="mb-4">Finish creating your space</p>
                      <DraftProgress
                        data={propertySpace ?? spaceData}
                        scheduleTemplate={scheduleTemplate}
                      />
                    </>
                  ) : (
                    <div className={"mb-[40px] flex grid-cols-3 flex-col gap-[16px] md:grid"}>
                      <div className="flex justify-between border px-[16px] py-[8px]">
                        <p>Space ID</p>
                        <p className="font-semibold">{id}</p>
                      </div>
                      <div className="flex justify-between border px-[16px] py-[8px]">
                        <p>Total Revenue</p>
                        <p className="font-semibold">
                          ${" "}
                          {myBookings
                            .reduce((acc, curr) => {
                              return acc + (curr.total ?? 0) + (curr.addon_cost ?? 0);
                            }, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="flex justify-between border px-[16px] py-[8px]">
                        <p>Total Bookings</p>
                        <p className="font-semibold">{myBookings.length}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
              <div className="mb-[18px] flex flex-col items-start justify-between md:flex-row md:items-center">
                <div className="flex flex-col items-start gap-4 normal-case md:flex-row md:items-center">
                  <h2 className="text-3xl font-semibold">{propertySpace.name ?? spaceData?.name}</h2>
                  <p className="text-[#475467]">{propertySpace.address_line_1 ?? spaceData?.address_line_1}</p>
                  <button
                    className="whitespace-nowrap text-sm underline"
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
                      space_id={propertySpace.id ?? spaceData?.id}
                      user_property_spaces_id={propertySpace.user_property_spaces_id ?? spaceData?.user_property_spaces_id}
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
                      className="h-1/2 rounded-lg object-cover md:w-full"
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

              <section className="relative flex flex-col items-start xl:flex-row xl:gap-12">
                <div className="w-full px-2 md:px-0 xl:w-3/5">
                  <h3 className="mb-[8px] text-2xl font-semibold">Description</h3>
                  <p className="">{propertySpace.description ?? spaceData?.description}</p>
                  <hr className="my-[47px]" />
                  <h3 className="mb-[12px] text-2xl font-semibold">Amenities</h3>
                  <ul className="addons-grid list-disk-important">
                    {spaceAmenities.map((am, idx) => (
                      <li
                        className="flex w-fit items-center gap-2 mb-4 sm:mb-0"
                        key={idx}
                      >
                        <CircleCheckIcon />
                        {am.amenity_name}
                      </li>
                    ))}
                  </ul>
                  <hr className="my-[47px]" />
                  <h3 className="mb-[8px] text-2xl font-semibold">Add ons</h3>
                  <ul className="addons-grid list-disk-important">
                    {spaceAddons.map((addon) => (
                      <li
                        className="flex w-fit sm:w-full items-center gap-2 mb-4 sm:mb-0"
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
                  <hr className="my-[47px]" />
                  <div className="mb-[28px] flex flex-wrap items-center justify-between">
                    <h3 className="mb-2 text-xl font-semibold md:mb-0 md:text-2xl">About the host</h3>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-start md:gap-[24px]">
                    <div className="w-max-content">
                    <img
                      src={hostData.photo ?? "/default.png"}
                      className="h-[72px] w-[72px] rounded-full object-cover"
                    />
                    </div>

                    <div className="space-y-3 w-[90%]">
                      <div className="flex text-xl font-bold gap-1">
                      <p className="md:block">{hostData.first_name}</p>
                      <p className="md:block">{hostData.last_name}</p>
                      </div>
                      <p className="hidden md:block">{propertySpace.about ?? spaceData?.about}</p>
                    </div>
                  </div>
                  
                  <p className="mt-4 block md:hidden">{propertySpace.about ?? spaceData?.about}</p>
                  <hr className="my-[47px]" />
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
                  <hr className="my-[47px]" />
                  <h3 className="mb-[8px] text-2xl font-semibold">FAQs</h3>
                  {faqs.map((faq) => (
                    <FaqAccordion
                      key={faq.id}
                      data={faq}
                    />
                  ))}
                  <hr className="my-[47px]" />
                  <h3 className="mb-[8px] text-2xl font-semibold">Property rules</h3>
                  <p className="mb-32">{propertySpace.rule ?? spaceData?.rule}</p>
                </div>

                <div className="sticky bottom-0 w-full flex-grow bg-white xl:top-16 xl:bottom-[unset] xl:w-[unset]">
                  <div className="sticky-price-summary mx-auto max-w-2xl p-6 md:border-2">
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
                    {propertySpace.additional_guest_rate && propertySpace.max_capacity > 1 ? (
                      <div className="mb-[13px] flex justify-between">
                        <span className="text-lg">Additional guest</span>
                        <span>
                          from: <strong className="font-semibold">${propertySpace.additional_guest_rate}</strong>/h
                        </span>
                      </div>
                    ) : null}
                    <hr className="my-[24px] hidden md:block" />
                    <form
                      className="flex flex-col"
                      onSubmit={handleSubmit(onSubmit)}
                    >
                      <div className="z-50 mb-3">
                        <DateTimePicker
                          register={register}
                          setValue={setValue}
                          fieldNames={["selectedDate", "from", "to"]}
                          showCalendar={showCalendar}
                          setShowCalendar={setShowCalendar}
                          fromDefault={""}
                          toDefault={""}
                          bookedSlots={bookedSlots.map((slot) => ({ fromTime: new Date(slot.start_time), toTime: new Date(slot.end_time) }))}
                          scheduleTemplate={scheduleTemplate}
                          defaultMessage="Check Availability"
                        />
                      </div>
                      <button
                        type="submit"
                        className="login-btn-gradient gap-2 rounded-tr rounded-br py-3 px-2 text-center tracking-wide text-white outline-none focus:outline-none"
                        disabled={true}
                      >
                        {window.innerWidth > 500 ? "Continue" : "Check Availability"}
                      </button>
                    </form>
                  </div>
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
            </div>
          </Tab.Panel>
          <Tab.Panel>
            {" "}
            <div className={"block"}>
              <MySpaceBookingHistoryPage myBookings={myBookings} />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <PropertySpaceMapImage
        modalImage={`https://maps.googleapis.com/maps/api/staticmap?center=${propertySpace.address_line_1 || ""}, ${propertySpace.address_line_2 || ""}, ${propertySpace.city || ""}, ${propertySpace.country || ""
          }&zoom=15&size=600x400&maptype=roadmap&markers=color:red|${propertySpace.address_line_1 || ""}, ${propertySpace.address_line_2 || ""}
      &key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
        modalOpen={showMap}
        closeModal={() => setShowMap(false)}
      />
      <DeleteSpaceConfirmation
        modalOpen={deleteSpace}
        closeModal={() => setDeleteSpace(false)}
        propertySpace={propertySpace}
      />
    </div>
  );
};

export default MySpaceDetailsPage;
