import React from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import FaqAccordion from "@/components/frontend/FaqAccordion";
import { useSpaceContext } from "./spaceContext";
import { useEffect } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import DateTimePicker from "@/components/frontend/DateTimePicker";
import { useForm } from "react-hook-form";
import CustomSelect from "@/components/frontend/CustomSelect";
import { DRAFT_STATUS, ID_VERIFICATION_STATUSES, IMAGE_STATUS, NOTIFICATION_STATUS, NOTIFICATION_TYPE, SPACE_STATUS, SPACE_VISIBILITY } from "@/utils/constants";
import ReCAPTCHA from "react-google-recaptcha";
import PropertyImageSlider from "@/components/frontend/PropertyImageSlider";
import { parseJsonSafely } from "@/utils/utils";
import PropertySpaceMapImage from "@/components/frontend/PropertySpaceMapImage";
import CircleCheckIcon from "@/components/frontend/icons/CircleCheckIcon";
import PencilIcon from "@/components/frontend/icons/PencilIcon";
import AccountNotVerifiedModal from "../Add/AccountNotVerifiedModal";
import { usePropertyAddons, usePropertySpace, usePropertySpaceAmenities, usePropertySpaceFaqs, usePropertySpaceImages, usePropertySpaceReviews, usePublicUserData } from "@/hooks/api";
import PropertyEditImageSlider from "@/components/frontend/PropertyEditImageSlider";
import EditDescriptionModal from "./EditDescriptionModal";
import EditPropertyNameModal from "./EditPropertNameModal";
import EditAddonsModal from "./EditAddonsModal";
import EditPropertyRulesModal from "./EditPropertyRulesModal";
import axios from "axios";
import usePropertySpaceImagesV2 from "@/hooks/api/usePropertySpaceImagesV2";
import EditAmenitiesModal from "./EditAmenitiesModal";
import useAmenityCategories from "@/hooks/api/useAmenityCategories";
import useAddonCategories from "@/hooks/api/useAddonCategories";

const EditPropertyDetails = () => {
  const { id } = useParams();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [render, forceRender] = useState(false);

  const { propertySpace, notFound } = usePropertySpace(id, render);
  const spaceImages = usePropertySpaceImagesV2(propertySpace.id, false);
  const { state: scheduleTemplate } = useLocation();
  const [editAmenities, setEditAmenities] = useState(false);
  const [editAddons, setEditAddons] = useState(false);
  const spaceAddons = usePropertyAddons(propertySpace.property_id, editAddons);
  const spaceAmenities = usePropertySpaceAmenities(propertySpace.id, editAmenities);

  const faqs = usePropertySpaceFaqs(propertySpace.id);
  const reviews = usePropertySpaceReviews(propertySpace.id);
  const [recaptchaValidated, setRecaptchaValidated] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { spaceData, dispatch } = useSpaceContext();

  const amenities = useAmenityCategories(propertySpace?.space_id, propertySpace?.category == "Others" ? true : false);

  let newAm = amenities.map(obj => Number(obj.id));

  const addons = useAddonCategories(propertySpace?.space_id, propertySpace?.category == "Others" ? true : false);

  let newAdd = addons.map(obj => Number(obj.id));

  // const { amenities, addons } = useOutletContext();

  const sdk = new MkdSDK();

  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);

  const navigate = useNavigate();

  const { register, setValue } = useForm();
  const [showCalendar, setShowCalendar] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [editPropertyName, setEditPropertyName] = useState(false);
  const [editPropertyRules, setEditPropertyRules] = useState(false);

  const [accountNotVerified, setAccountNotVerified] = useState(false);

  useEffect(() => {
    dispatch({ type: "SET_DESCRIPTION", payload: propertySpace.description })
    dispatch({ type: "SET_ADDONS", payload: spaceAddons })
    dispatch({ type: "SET_AMENITIES", payload: spaceAmenities })
    dispatch({ type: "SET_RULE", payload: propertySpace.rule })
    dispatch({ type: "SET_PROPERTY_NAME", payload: propertySpace.name })
  }, []);

  // Read values passed on state


  const onSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log("submitting");
    if (globalState.user.verificationStatus != ID_VERIFICATION_STATUSES.VERIFIED && !accountNotVerified) {
      setAccountNotVerified(true);
      return;
    }
    globalDispatch({ type: "START_LOADING" });
    const host_id = Number(localStorage.getItem("user"));

    try {
      // edit property
      sdk.setTable("property");
      const propertyResult = await sdk.callRestAPI(
        {
          id: id,
          name: spaceData?.name ? spaceData?.name : propertySpace?.name,
          rule: spaceData?.rule ? spaceData?.rule : propertySpace?.rule,
        },
        "PUT",
      );

      // approve property space
      await axios.post("https://ergo.mkdlabs.com/rest/property_spaces/PUT",
        { id: Number(id), draft_status: DRAFT_STATUS.COMPLETED },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-project": "ZXJnbzprNWdvNGw1NDhjaDRxazU5MTh4MnVsanV2OHJxcXAyYXM",
          },
        },
      );

      // create notification
      sdk.setTable("notification");
      await sdk.callRestAPI(
        {
          user_id: host_id,
          actor_id: null,
          action_id: id,
          notification_time: new Date().toISOString().split(".")[0],
          message: "Space Draft Status Completed",
          type: NOTIFICATION_TYPE.CREATE_SPACE,
          status: NOTIFICATION_STATUS.NOT_ADDRESSED,
        },
        "POST",
      );
      navigate("/spaces/add/5");
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
    window.scrollTo({ top: 0, left: 0 });
  };

  const onChange = () => {
    setRecaptchaValidated(true);
  };

  return (
    <div
      className="min-h-screen bg-white pb-20 text-sm normal-case md:text-base"
      onClick={() => {
        setShowCalendar(false);
      }}
    >
      <h1 className="mb-4 text-4xl font-bold">Review</h1>
      <p className="mb-8">Below is how people will see your listing:</p>
      <div className="mb-[18px] flex flex-col items-start justify-between px-[17px] md:flex-row md:items-center md:px-0">
        <div className="flex flex-col items-start gap-4 normal-case md:flex-row md:items-center">
          <h2 className="text-3xl font-semibold">
            {spaceData?.name ? spaceData?.name : propertySpace?.name}
          </h2>
          <button
            className="whitespace-nowrap text-sm underline"
            target="_blank"
            onClick={() => setShowMap(true)}
          >
            (view on map)
          </button>
          <div className="flex justify-end ">
            <button onClick={() => setEditPropertyName(true)}>
              <PencilIcon stroke="#33d4b7" />
            </button>
          </div>
        </div>
      </div>
      <div className="snap-scroll relative mb-[66px] flex h-[381px] gap-[32px] px-[14px] md:px-0">
        <img
          src={spaceImages[0]?.photo_url || "/default-property.jpg"}
          className="h-full rounded-lg object-cover xl:min-w-[616px]"
        />
        <img
          src={spaceImages[1]?.photo_url || "/default-property.jpg"}
          className="h-full w-[292px] rounded-lg object-cover"
        />
        <div className="flex min-w-[550px] flex-col gap-4 overflow-hidden md:gap-[32px]">
          <img
            src={spaceImages[2]?.photo_url || "/default-property.jpg"}
            className="h-1/2 rounded-lg object-cover md:w-full"
          />
          <img
            src={spaceImages[3]?.photo_url || "/default-property.jpg"}
            className="h-1/2 rounded-lg object-cover md:w-full"
          />
          <img
            src={spaceImages[4]?.photo_url || "/default-property.jpg"}
            className="h-1/2 rounded-lg object-cover md:w-full"
          />
        </div>
        <button
          className="sticky right-6 mb-[8px] min-w-[170px] self-end border bg-[#00000080] px-3 py-1 text-center text-sm text-white"
          onClick={() => setGalleryOpen(true)}
        >
          View all photos ({spaceImages.filter((v) => v != null).length})
        </button>
      </div>
      <section className="relative flex flex-col items-start xl:flex-row xl:gap-12">
        <div className="w-full px-2 md:px-0 xl:w-3/5">
          <div className="py-12 px-3 flex items-center justify-between">
            <div>
              <h3 className="mb-2 text-2xl font-semibold">Description</h3>
              <p>{spaceData?.description ? spaceData?.description : propertySpace?.description}</p>
            </div>
            <div className="">
              <button onClick={() => setEditDescription(true)}>
                <PencilIcon stroke="#33d4b7" />
              </button>
            </div>
          </div>
          <hr />
          <div className="py-12 px-3 ">
            <div>
              <div className="flex items-center justify-between w-full">
                <h3 className="mb-[8px] text-2xl font-semibold">Amenities</h3>
                <div className="">
                  <button onClick={() => setEditAmenities(true)}>
                    <PencilIcon stroke="#33d4b7" />
                  </button>
                </div>
              </div>

              <ul className="addons-grid list-disk-important">
                {(spaceAmenities)?.map((am) => (
                  <li
                    className="flex gap-[14px] w-[200px]"
                    key={am.id}
                  >
                    <CircleCheckIcon />
                    {am.amenity_name}
                  </li>
                ))}
              </ul>
            </div>

          </div>
          <hr />
          <div className="py-12 px-3">
            <div>
              <div className="flex items-center justify-between w-full">
                <h3 className="mb-[8px] text-2xl font-semibold">Add ons</h3>
                <div className="">
                  <button onClick={() => setEditAddons(true)}>
                    <PencilIcon stroke="#33d4b7" />
                  </button>
                </div>
              </div>
              <ul className="addons-grid">
                {(spaceAddons)?.map((addon) => (
                  <li
                    className="flex w-fit gap-3"
                    key={addon.id}
                  >
                    <span className="w-fit">
                      <div className="flex flex-wra gap-2">
                        <CircleCheckIcon /> {addon.add_on_name ?? addon.name}
                      </div>
                    </span>
                    <strong className="font-semibold">${addon.cost}/h</strong>
                  </li>
                ))}
              </ul>
            </div>

          </div>
          <hr />
          <div className="py-12 px-3">
            <div className="mb-[28px] flex flex-wrap items-center justify-between">
              <h3 className="mb-2 text-2xl font-semibold md:mb-0">About the host</h3>
            </div>
            <div className="flex items-center justify-between gap-4 md:justify-start md:gap-[24px]">
              <img
                src={globalState.user.photo ?? "/default.png"}
                className="h-[72px] w-[72px] rounded-full object-cover"
              />
               <div className="space-y-3">
              <div className="flex text-xl font-bold gap-1">
              <p className="md:block">{globalState.user.first_name}</p>
              <p className="md:block">{globalState.user.last_name}</p>
              </div>
              <p className="hidden md:block">{globalState.user.about}</p>
            </div>

            </div>
          </div>
          <hr />
          <div className="py-12 px-3">
            <div className="mb-[18px] flex items-center justify-between">
              <h3 className="mb-[8px] text-2xl font-semibold">Reviews</h3>
              <CustomSelect
                options={[
                  { label: "By Date: Newest First", value: "DESC" },
                  { label: "By Date: Oldest First", value: "ASC" },
                ]}
                accessor="label"
                valueAccessor="value"
                className="min-w-[200px]"
              />
            </div>
          </div>
          <hr />
          <div className="py-12 px-3">
            <h3 className="mb-[8px] text-2xl font-semibold">FAQs</h3>
            {faqs.map((faq, idx) => (
              <FaqAccordion
                key={idx}
                data={faq}
              />
            ))}
          </div>
          <hr />
          <div className="py-12 px-3 flex items-center justify-between">
            <div>
              <h3 className="mb-[8px] text-2xl font-semibold">Property rules</h3>
              <p>{spaceData?.rule ? spaceData?.rule : propertySpace?.rule}</p>

            </div>
            <div className="">
              <button onClick={() => setEditPropertyRules(true)}>
                <PencilIcon stroke="#33d4b7" />
              </button>
            </div>
          </div>
        </div>
        {/* <div className="sticky bottom-0 hidden w-full flex-grow bg-white xl:top-16 xl:bottom-[unset] xl:block xl:w-[unset]">
          <div className="sticky-price-summary mx-auto max-w-2xl p-6 md:border-2">
            <h3 className="mb-[8px] text-2xl font-semibold">Price and availability</h3>
            <div className="mb-[13px] flex justify-between">
              <span className="text-lg">Max capacity</span>
              <span>
                {" "}
                <strong className="font-semibold">{propertySpace.max_capacity}</strong> people
              </span>
            </div>
            <div className="mb-[13px] flex justify-between">
              <span className="text-lg">Pricing fro</span>
              <span>
                from: <strong className="font-semibold">${propertySpace?.rate}</strong>/h
              </span>
            </div>
            {propertySpace.additional_guest_rate || (propertySpace.max_capacity > 1) ? (
              <div className="mb-[13px] flex justify-between">
                <span className="text-lg">Additional guests</span>
                <span>
                  from: <strong className="font-semibold">${propertySpace.additional_guest_rate}</strong>/h
                </span>
              </div>
            ) : null}
            <hr className="my-[24px] hidden md:block" />
            <form className="flex flex-col">
              <div className="z-50 mb-3">
                <DateTimePicker
                  register={register}
                  setValue={setValue}
                  fieldNames={["selectedDate", "from", "to"]}
                  showCalendar={showCalendar}
                  setShowCalendar={setShowCalendar}
                  fromDefault={""}
                  toDefault={""}
                  bookedSlots={[]}
                  scheduleTemplate={{ scheduleTemplate, slots: parseJsonSafely(scheduleTemplate?.slots, []), custom_slots: scheduleTemplate.customSlots }}
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
        </div> */}
        <div className="mx-auto block w-full max-w-xl p-6 xl:hidden">
          <h3 className="mb-[8px] text-2xl font-semibold">Price and availability</h3>
          <div className="mb-[13px] flex justify-between">
            <span className="text-lg">Max capacity</span>
            <span>
              {" "}
              <strong className="font-semibold">{propertySpace.max_capacity ?? propertySpace?.max_capacity}</strong> people
            </span>
          </div>
          <div className="mb-[13px] flex justify-between">
            <span className="text-lg">Pricing from</span>
            <span>
              from: <strong className="font-semibold">${propertySpace.rate}</strong>/h
            </span>
          </div>
          {(propertySpace.additional_guest_rate && (propertySpace.max_capacity > 1)) ? (
            <div className="mb-[13px] flex justify-between">
              <span className="text-lg">Additional guests</span>
              <span>
                from: <strong className="font-semibold">${propertySpace.additional_guest_rate}</strong>/h
              </span>
            </div>
          ) : null}

          <form className="flex flex-col">
            <div className="z-50 mb-3">
              <DateTimePicker
                register={register}
                setValue={setValue}
                fieldNames={["selectedDate", "from", "to"]}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                fromDefault={""}
                toDefault={""}
                bookedSlots={[]}
                scheduleTemplate={{ ...scheduleTemplate, slots: parseJsonSafely(scheduleTemplate?.slots, []), custom_slots: scheduleTemplate.customSlots }}
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
      </section>
      <PropertyEditImageSlider
        spaceImages={spaceImages.filter((v) => v != null)}
        modalOpen={galleryOpen}
        closeModal={() => setGalleryOpen(false)}
      />

      <hr className="my-[30px]" />
      <button
        type="button"
        className="sixteen-step login-btn-gradient rounded py-2 px-4 tracking-wide text-white outline-none focus:outline-none"
        onClick={onSubmit}
      >
        Submit
      </button>
      <br />
      <PropertySpaceMapImage
        modalImage={`https://maps.googleapis.com/maps/api/staticmap?center=${propertySpace.address_line_1 || ""}, ${propertySpace.address_line_2 || ""}, ${propertySpace.city || ""}, ${propertySpace.country || ""
          }&zoom=15&size=600x400&maptype=roadmap&markers=color:red|${propertySpace.address_line_1 || ""}, ${propertySpace.address_line_2 || ""}
      &key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
        modalOpen={showMap}
        closeModal={() => setShowMap(false)}
      />
      <EditDescriptionModal
        modalOpen={editDescription}
        propertyDescription={propertySpace?.description}
        closeModal={() => setEditDescription(false)}
      />
      <EditPropertyNameModal
        name={propertySpace?.name}
        modalOpen={editPropertyName}
        closeModal={() => setEditPropertyName(false)}
      />
      <EditAmenitiesModal
        modalOpen={editAmenities}
        category={propertySpace?.category}
        propertyAmenities={spaceAmenities}
        id={propertySpace?.space_id}
        closeModal={() => setEditAmenities(false)}
        idAm={newAm}
        p_id={id}
        forceRender={forceRender}
      />
      <EditAddonsModal
        modalOpen={editAddons}
        category={propertySpace?.category}
        propertyAddons={spaceAddons}
        id={propertySpace?.space_id}
        closeModal={() => setEditAddons(false)}
        idAm={newAdd}
        property_id={propertySpace?.property_id}
        p_id={id}
        forceRender={forceRender}
      />
      <EditPropertyRulesModal
        modalOpen={editPropertyRules}
        rules={propertySpace?.rule}
        closeModal={() => setEditPropertyRules(false)}
      />
      <AccountNotVerifiedModal
        modalOpen={accountNotVerified}
        closeModal={() => setAccountNotVerified(false)}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default EditPropertyDetails;
