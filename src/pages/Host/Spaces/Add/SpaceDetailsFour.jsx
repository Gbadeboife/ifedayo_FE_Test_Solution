import React from "react";
import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
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
import EditDescriptionModal from "./EditDescriptionModal";
import EditAmenitiesModal from "./EditAmenitiesModal";
import EditAddonsModal from "./EditAddonsModal";
import EditPropertyRulesModal from "./EditPropertyRulesModal";
import EditPropertyNameModal from "./EditPropertyNameModal";
import AccountNotVerifiedModal from "./AccountNotVerifiedModal";
import PropertyImageSliderAdd from "@/components/frontend/PropertyImageSliderAdd";

const SpaceDetailsFour = () => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { amenities, addons } = useOutletContext();
  const [recaptchaValidated, setRecaptchaValidated] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { spaceData, dispatch } = useSpaceContext();
  const sdk = new MkdSDK();

  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const navigate = useNavigate();

  const { register, setValue } = useForm();
  const [showCalendar, setShowCalendar] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [editPropertyName, setEditPropertyName] = useState(false);
  const [editAmenities, setEditAmenities] = useState(false);
  const [editAddons, setEditAddons] = useState(false);
  const [editPropertyRules, setEditPropertyRules] = useState(false);

  const [accountNotVerified, setAccountNotVerified] = useState(false);

  // useEffect(() => {
  //   if (!spaceData.name) {
  //     navigate("/spaces/add");
  //     return;
  //   }
  // }, []);

  const onSubmit = async (e) => {
    if (e) e.preventDefault();
    if (globalState.user.verificationStatus != ID_VERIFICATION_STATUSES.VERIFIED && !accountNotVerified) {
      setAccountNotVerified(true);
      return;
    }
    globalDispatch({ type: "START_LOADING" });
    const host_id = Number(localStorage.getItem("user"));

    try {
      // create property
      sdk.setTable("property");
      const propertyResult = await sdk.callRestAPI(
        {
          address_line_1: spaceData.address_line_1,
          address_line_2: spaceData.address_line_2,
          city: spaceData.city,
          country: spaceData.country,
          zip: spaceData.zip,
          status: 1,
          verified: 1,
          host_id,
          name: spaceData.name,
          rule: spaceData.rule,
        },
        "POST",
      );
      // create property add ons
      sdk.setTable("property_add_on");
      for (let i = 0; i < spaceData.addons.length; i++) {
        const addon_id = spaceData.addons[i];
        await sdk.callRestAPI(
          {
            property_id: propertyResult.message,
            add_on_id: addon_id,
          },
          "POST",
        );
      }
      // create property space
      sdk.setTable("property_spaces");
      const propertySpaceResult = await sdk.callRestAPI(
        {
          property_id: propertyResult.message,
          space_id: spaceData.category,
          max_capacity: spaceData.max_capacity,
          description: spaceData.description,
          rate: spaceData.rate,
          availability: SPACE_VISIBILITY.VISIBLE,
          draft_status: DRAFT_STATUS.COMPLETED,
          space_status: SPACE_STATUS.UNDER_REVIEW,
          additional_guest_rate: spaceData.additional_guest_rate || undefined,
          size: spaceData.size || undefined,
        },
        "POST",
      );
      // create property space images
      for (let i = 0; i < spaceData.pictureIds.length; i++) {
        sdk.setTable("property_spaces_images");
        const pictureId = spaceData.pictureIds[i];
        if (pictureId) {
          await sdk.callRestAPI(
            {
              property_id: propertyResult.message,
              property_spaces_id: propertySpaceResult.message,
              photo_id: pictureId,
              is_approved: IMAGE_STATUS.IN_REVIEW,
            },
            "POST",
          );
        }
        if (pictureId && pictureId == spaceData.thumbnail) {
          sdk.setTable("property_spaces");
          await sdk.callRestAPI(
            {
              id: propertySpaceResult.message,
              default_image_id: spaceData.thumbnail,
            },
            "PUT",
          );
        }
      }

      // create property space faqs
      sdk.setTable("property_space_faq");
      for (let i = 0; i < spaceData.faqs.length; i++) {
        const faq = spaceData.faqs[i];
        await sdk.callRestAPI(
          {
            property_space_id: propertySpaceResult.message,
            question: faq.question,
            answer: faq.answer,
          },
          "POST",
        );
      }
      // create property space amenities
      sdk.setTable("property_spaces_amenitites");
      for (let i = 0; i < spaceData.amenities.length; i++) {
        const amenity_id = spaceData.amenities[i];
        await sdk.callRestAPI(
          {
            property_spaces_id: propertySpaceResult.message,
            amenity_id,
          },
          "POST",
        );
      }

      // create scheduling
      sdk.setTable("property_spaces_schedule_template");
      await sdk.callRestAPI(
        {
          property_spaces_id: propertySpaceResult.message,
          schedule_template_id: spaceData.schedule_template.id,
          custom_slots: JSON.stringify(spaceData.customSlots),
        },
        "POST",
      );

      // create notification
      sdk.setTable("notification");
      await sdk.callRestAPI(
        {
          user_id: host_id,
          actor_id: null,
          action_id: propertySpaceResult.message,
          notification_time: new Date().toISOString().split(".")[0],
          message: "New Space Created",
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
          <h2 className="text-3xl font-semibold">{spaceData.name}</h2>
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
          src={spaceData.pictures[0] || "/default-property.jpg"}
          className="h-full rounded-lg object-cover xl:min-w-[616px]"
        />
        <img
          src={spaceData.pictures[1] || "/default-property.jpg"}
          className="h-full w-[292px] rounded-lg object-cover"
        />
        <div className="flex min-w-[550px] flex-col gap-4 overflow-hidden md:gap-[32px]">
          <img
            src={spaceData.pictures[2] || "/default-property.jpg"}
            className="h-1/2 rounded-lg object-cover md:w-full"
          />
          <img
            src={spaceData.pictures[3] || "/default-property.jpg"}
            className="h-1/2 rounded-lg object-cover md:w-full"
          />
        </div>
        {spaceData.pictures.filter((v) => (v != null && v != "")).length > 0 &&
          <button
            className="sticky right-6 mb-[8px] min-w-[170px] self-end border bg-[#00000080] px-3 py-1 text-center text-sm text-white"
            onClick={() => setGalleryOpen(true)}
          >
            <span>View all photos ({spaceData.pictures.filter((v) => (v != null && v != "")).length})</span>
          </button>
        }
      </div>
      <section className="relative flex flex-col items-start xl:flex-row xl:gap-12">
        <div className="w-full px-2 md:px-0 xl:w-3/5">
          <div className="py-12 px-3 flex items-center justify-between">
            <div>
              <h3 className="mb-2 text-2xl font-semibold">Description</h3>
              <p>{spaceData.description}</p>
            </div>
            <div className="">
              <button onClick={() => setEditDescription(true)}>
                <PencilIcon stroke="#33d4b7" />
              </button>
            </div>
          </div>
          <hr />
          <div className="py-12 px-3 flex items-center justify-between">
            <div>
              <h3 className="mb-[8px] text-2xl font-semibold">Amenities</h3>
              <ul className="addons-grid list-disk-important">
                {amenities.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1))
                  ?.filter((am) => spaceData.amenities.includes(String(am.id)))
                  .map((am) => (
                    <li
                      className="flex gap-4"
                      key={am.id}
                    >
                      <CircleCheckIcon />
                      {am.name}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="">
              <button onClick={() => setEditAmenities(true)}>
                <PencilIcon stroke="#33d4b7" />
              </button>
            </div>
          </div>
          <hr />
          <div className="py-12 px-3 flex items-center justify-between">
            <div className="w-full">
              <h3 className="mb-[8px] text-2xl font-semibold">Add ons</h3>
              <ul className="addons-grid list-disk-important">
                {addons?.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1))
                  ?.filter((addon) => spaceData.addons.includes(String(addon.id)))
                  .map((addon) => (
                    <li
                      className="flex"
                      key={addon.id}
                    >
                      <span className="w-full">
                        {" "}
                        <div className="flex w-fit gap-4">
                          <CircleCheckIcon /> {addon.name}
                          <strong className="font-semibold">${addon.cost}/h</strong>
                        </div>{" "}
                      </span>{" "}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="">
              <button onClick={() => setEditAddons(true)}>
                <PencilIcon stroke="#33d4b7" />
              </button>
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
            {spaceData.faqs.map((faq, idx) => (
              <FaqAccordion
                key={idx}
                data={faq}
              />
            ))}
            {/* <div className="">
              <button onClick={() => (true)}>
                <PencilIcon stroke="#33d4b7" />
              </button>
            </div> */}
          </div>
          <hr />
          <div className="py-12 px-3 flex items-center justify-between mb-20 sm:mb-0">
            <div>
              <h3 className="mb-[8px] text-2xl font-semibold">Property rules</h3>
              <p className="">{spaceData.rule}</p>
            </div>
            <div className="">
              <button onClick={() => setEditPropertyRules(true)}>
                <PencilIcon stroke="#33d4b7" />
              </button>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 hidden w-full flex-grow bg-white xl:top-16 xl:bottom-[unset] xl:block xl:w-[unset]">
          <div className="sticky-price-summary mx-auto max-w-2xl p-6 md:border-2">
            <h3 className="mb-[8px] text-2xl font-semibold">Price and availability</h3>
            <div className="mb-[13px] flex justify-between">
              <span className="text-lg">Max capacity</span>
              <span>
                {" "}
                <strong className="font-semibold">{spaceData.max_capacity}</strong> people
              </span>
            </div>
            <div className="mb-[13px] flex justify-between">
              <span className="text-lg">Pricing from</span>
              <span>
                from: <strong className="font-semibold">${spaceData?.rate}</strong>/h
              </span>
            </div>
            {spaceData.additional_guest_rate && spaceData.max_capacity > 1 ? (
              <div className="mb-[13px] flex justify-between">
                <span className="text-lg">Additional guests</span>
                <span>
                  from: <strong className="font-semibold">${spaceData.additional_guest_rate}</strong>/h
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
                  scheduleTemplate={{ ...spaceData.schedule_template, slots: parseJsonSafely(spaceData.schedule_template?.slots, []), custom_slots: spaceData.customSlots }}
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
        <div className="mx-auto -mt-16 block w-full max-w-xl p-6 xl:hidden">
          <h3 className="mb-[8px] text-2xl font-semibold">Price and availability</h3>
          <div className="mb-[13px] flex justify-between">
            <span className="text-lg">Max capacity</span>
            <span>
              {" "}
              <strong className="font-semibold">{spaceData.max_capacity ?? spaceData?.max_capacity}</strong> people
            </span>
          </div>
          <div className="mb-[13px] flex justify-between">
            <span className="text-lg">Pricing from</span>
            <span>
              from: <strong className="font-semibold">${spaceData.rate}</strong>/h
            </span>
          </div>

          <form className="flex flex-col">
            <div className="z-20 mb-3">
              <DateTimePicker
                register={register}
                setValue={setValue}
                fieldNames={["selectedDate", "from", "to"]}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                fromDefault={""}
                toDefault={""}
                bookedSlots={[]}
                scheduleTemplate={{ ...spaceData.schedule_template, slots: parseJsonSafely(spaceData.schedule_template?.slots, []), custom_slots: spaceData.customSlots }}
                defaultMessage="Check Availability"
              />
            </div>
            <button
              type="submit"
              className="login-btn-gradient z-0 gap-2 rounded-tr rounded-br py-3 px-2 text-center tracking-wide text-white outline-none focus:outline-none"
              disabled={true}
            >
              {window.innerWidth > 500 ? "Continue" : "Check Availability"}
            </button>
          </form>
        </div>
      </section>
      <PropertyImageSliderAdd
        spaceImages={spaceData.pictures.filter((v) => (v != null && v != ""))}
        modalOpen={galleryOpen}
        closeModal={() => setGalleryOpen(false)}
      />

      <hr className="my-[30px]" />
      {/* <ReCAPTCHA
        className="recaptcha-v2 mb-4"
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        onChange={onChange}
      /> */}
      <button
        type="button"
        className="sixteen-step login-btn-gradient rounded py-2 px-4 tracking-wide text-white outline-none focus:outline-none"
        onClick={onSubmit}
      >
        Submit
      </button>
      <br />
      <PropertySpaceMapImage
        modalImage={`https://maps.googleapis.com/maps/api/staticmap?center=${spaceData.address_line_1 || ""}, ${spaceData.address_line_2 || ""}, ${spaceData.city || ""}, ${spaceData.country || ""
          }&zoom=15&size=600x400&maptype=roadmap&markers=color:red|${spaceData.address_line_1 || ""}, ${spaceData.address_line_2 || ""}
      &key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
        modalOpen={showMap}
        closeModal={() => setShowMap(false)}
      />
      <EditDescriptionModal
        modalOpen={editDescription}
        closeModal={() => setEditDescription(false)}
      />
      <EditPropertyNameModal
        modalOpen={editPropertyName}
        closeModal={() => setEditPropertyName(false)}
      />
      <EditAmenitiesModal
        modalOpen={editAmenities}
        closeModal={() => setEditAmenities(false)}
      />
      <EditAddonsModal
        modalOpen={editAddons}
        closeModal={() => setEditAddons(false)}
      />
      {/* <EditFaqsModal /> */}
      <EditPropertyRulesModal
        modalOpen={editPropertyRules}
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

export default SpaceDetailsFour;
