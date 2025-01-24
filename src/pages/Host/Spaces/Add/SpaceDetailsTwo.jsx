import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { useFieldArray, useForm } from "react-hook-form";
import * as yup from "yup";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { useNavigate, useOutletContext } from "react-router";
import { useSpaceContext } from "./spaceContext";
import { useEffect } from "react";
import MkdSDK from "@/utils/MkdSDK";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import { useContext } from "react";
import { GlobalContext, showToast } from "@/globalContext";
import { DRAFT_STATUS, IMAGE_STATUS, SPACE_STATUS, SPACE_VISIBILITY } from "@/utils/constants";
import { Link } from "react-router-dom";
import CustomSelectV2 from "@/components/CustomSelectV2";
import useCancellation from "@/hooks/api/useCancellation";
import { sanitizeAndTruncate } from "@/utils/utils";
import CircleCheckIcon from "@/components/frontend/icons/CircleCheckIcon";
import HostAddAddonsModal from "@/components/HostAddAddonsModal";
import TreeSDK from "@/utils/TreeSDK";

const treeSdk = new TreeSDK();

async function getFileFromUrl(url) {
  if (!url) return null;
  try {
    let response = await fetch(url);
    let data = await response.blob();
    let metadata = {
      type: "image/jpeg",
    };
    return new File([data], url.split("/").pop(), metadata);
  } catch (err) {
    return null;
  }
}

const readImage = (file, previewEl) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById(previewEl).src = event.target.result;
  };

  reader.readAsDataURL(file);
};

const SpaceDetailsTwo = () => {
  const { spaceData, dispatch } = useSpaceContext();
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [pictures, setPictures] = useState([]);
  const [addOnModal, setAddOnModal] = useState(false);

  const [addAmenitiesPopup, setAddAmenitiesPopup] = useState(false);
  const showAddAmenitiesPopup = useDelayUnmount(addAmenitiesPopup, 100);
  const cancellationPolicy = useCancellation();
  const [addAddonsPopup, setAddAddonsPopup] = useState(false);
  const showAddAddonsPopup = useDelayUnmount(addAddonsPopup, 100);
  const { addons, amenities } = useOutletContext();
  const sdk = new MkdSDK();
  const { spaceCategories, ruleTemplates } = useOutletContext();

  const navigate = useNavigate();
  const schema = yup.object({
    question: yup.string(),
  });

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: spaceData,
  });

  const formValues = watch();

  const selectedAmenities = watch("amenities");
  const selectedAddons = watch("addons");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "faqs",
  });

  const handleImageUpload = async (file) => {
    if (!file) return { url: "", id: null };
    const formData = new FormData();
    formData.append("file", file);

    try {
      const upload = await sdk.uploadImage(formData);
      return upload;
    } catch (error) {
      return { url: "", id: null };
    }
  };

  const onSubmit = async (data) => {
    const uploadedImages = [];
    const uploadedIds = [];
    globalDispatch({ type: "START_LOADING" });

    for (let i = 0; i < pictures.length; i++) {
      const file = pictures[i];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (file?.type && !allowedTypes.includes(file?.type)) {
      showToast(globalDispatch, 'Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed.', 4000, "ERROR");
        return;
    }

    if (file?.size && file?.size > 5 * 1024 * 1024) { // 5 MB limit
      showToast(globalDispatch, 'One of the image is too large. Max size is 5 MB.', 4000, "ERROR");
      return;
  }
    
      const upload = await handleImageUpload(file);
      uploadedImages[i] = upload.url;
      uploadedIds[i] = upload.id;
      if (file?.name == data.thumbnail) {
        dispatch({ type: "SET_THUMBNAIL", payload: upload.id });
      }
    }
    dispatch({ type: "SET_DETAILS_TWO", payload: { faqs: data.faqs, amenities: data.amenities, addons: data.addons, pictures: uploadedImages, pictureIds: uploadedIds } });
    globalDispatch({ type: "STOP_LOADING" });

    navigate("/spaces/add/3");
    window.scrollTo({ top: 0, left: 0 });
  };

  const onSaveDraft = async () => {
    const host_id = localStorage.getItem("user");
    globalDispatch({ type: "START_LOADING" });
    var propertyResult, propertySpaceResult;

    try {
      if (!spaceData.property_id) {
        sdk.setTable("property");
        propertyResult = await sdk.callRestAPI(
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
        dispatch({ type: "SET_PROPERTY_ID", payload: propertyResult.message });
      }

      // create space
      if (!spaceData.property_space_id) {
        sdk.setTable("property_spaces");
        propertySpaceResult = await sdk.callRestAPI(
          {
            property_id: propertyResult?.message ?? spaceData.property_id,
            space_id: spaceData.category,
            max_capacity: spaceData.max_capacity,
            description: spaceData.description,
            rate: spaceData.rate,
            space_status: SPACE_STATUS.UNDER_REVIEW,
            availability: SPACE_VISIBILITY.VISIBLE,
            draft_status: DRAFT_STATUS.IMAGES,
            additional_guest_rate: spaceData.additional_guest_rate || undefined,
            size: spaceData.size || undefined,
          },
          "POST",
        );
      }

      // create property add ons
      sdk.setTable("property_add_on");
      for (let i = 0; i < formValues.addons.length; i++) {
        const addon_id = formValues.addons[i];
        const propertyAddonResult = await sdk.callRestAPI(
          {
            property_id: propertyResult?.message ?? spaceData.property_id,
            add_on_id: addon_id,
          },
          "POST",
        );
      }

      // create property space images
      for (let i = 0; i < pictures.length; i++) {
        sdk.setTable("property_spaces_images");
        const file = pictures[i];

        const upload = await handleImageUpload(file);
        if (upload.id) {
          const propertySpaceImagesResult = await sdk.callRestAPI(
            {
              property_id: propertyResult?.message ?? spaceData.property_id,
              property_spaces_id: propertySpaceResult.message,
              photo_id: upload.id,
              is_approved: IMAGE_STATUS.IN_REVIEW,
            },
            "POST",
          );
        }
        if (file?.name == formValues.thumbnail) {
          sdk.setTable("property_spaces");
          const defaultImageResult = await sdk.callRestAPI(
            {
              id: propertySpaceResult.message,
              default_image_id: upload.id,
              // is_approved: IMAGE_STATUS.APPROVED,
            },
            "PUT",
          );
        }
      }

      // create property space faqs
      sdk.setTable("property_space_faq");
      for (let i = 0; i < formValues.faqs.length; i++) {
        const faq = formValues.faqs[i];
        const propertySpaceFaqResult = await sdk.callRestAPI(
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
      for (let i = 0; i < formValues.amenities.length; i++) {
        const amenity_id = formValues.amenities[i];
        const propertySpaceAmenityResult = await sdk.callRestAPI(
          {
            property_spaces_id: propertySpaceResult.message,
            amenity_id,
          },
          "POST",
        );
      }
      navigate("/account/my-spaces");
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
  };

  useEffect(() => {
    setValue("amenities", spaceData.amenities);
  }, [amenities]);

  useEffect(() => {
    setValue("addons", spaceData.addons);
  }, [addons]);

  useEffect(() => {
    for (let i = 0; i < spaceData.pictures.length; i++) {
      const url = spaceData.pictures[i];
      getFileFromUrl(url).then((picFile) => {
        setPictures((prev) => {
          var copy = [...prev];
          copy[i] = picFile;
          return copy;
        });
      });
    }
  }, []);

  function isCatOthers(){
    const cat = spaceCategories.find((cat) => Number(cat.id) == Number(spaceData.category))
    if (cat?.category === "Others") {
      return true
    } else return false
  }

  return (
    <div className="min-h-screen pb-40 md:max-w-[656px]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">Space Details</h1>
        <div className="text-sm md:px-[20px] md:py-[32px]">
          <h3 className="text-xl font-semibold md:text-2xl">* Photographs of the space</h3>
          <p className="mb-8">file type (jpeg/png/svg), max size (5MB), suggest resolution (640*480)</p>
          <div className="eighteen-step-image mb-8 flex flex-wrap justify-center gap-x-2 gap-y-4 md:gap-5">
            {pictures.map((file, idx) => {
              // add FileUploader logic here
            })}
          </div>
          <h3 className="mb-4 text-xl font-bold">* Select thumbnail image</h3>
          <CustomSelectV2
            items={pictures.filter((pic) => pic?.name)}
            labelField="name"
            valueField="name"
            containerClassName="mb-12"
            className="w-full border py-2 px-3 focus:outline-primary"
            openClassName="ring-primary ring-2"
            placeholder={"Select thumbnail"}
            control={control}
            name="thumbnail"
          />
          <h3 className="mb-4 text-xl font-bold">
            What do you offer with the space <span className="text-sm font-normal italic text-gray-500">(optional)</span>
          </h3>
          <div className="flex gap-3 items-center">
          <button
            type="button"
            className="mb-2 font-bold text-[#1570EF]"
            onClick={() => setAddAmenitiesPopup(true)}
          >
            + Select items
          </button>

          </div>
          <div className="addons-grid mb-12">
            {amenities
              ?.filter((am) => {
                if (Array.isArray(selectedAmenities)) {
                  return selectedAmenities?.includes(String(am.id));
                }
                return false;
              }).sort((a, b) => (a.space_id === null ? -1 : 1) - (b.space_id === null ? -1 : 1))
              .map((am) => (
                <li
                  className="flex w-fit items-center gap-2 mb-4 sm:mb-0"
                  key={am.id}>
                  <CircleCheckIcon />
                  {am.name}
                </li>
              ))}
          </div>
          <h3 className="mb-4 text-xl font-bold">
            Add-ons <span className="text-sm font-normal italic text-gray-500">(optional)</span>
          </h3>
          <div className="flex gap-3 items-center">
          <button
            type="button"
            className="mb-2 font-bold text-[#1570EF]"
            onClick={() => setAddAddonsPopup(true)}
          >
            + Select items
          </button>

          </div>
        
          <div className="addons-grid mb-12">
            {addons
              ?.filter((addon) => {
                if (Array.isArray(selectedAddons)) {
                  return selectedAddons?.includes(String(addon.id));
                }
                return false;
              }).sort((a, b) => (a.space_id === null ? -1 : 1) - (b.space_id === null ? -1 : 1))
              .map((addon) => (
                <li
                  className="flex w-fit items-center gap-2 mb-4 sm:mb-0"
                  key={addon.id}>
                  <CircleCheckIcon />
                  {addon.name}</li>
              ))}
          </div>
          <h3 className="mb-2 text-xl font-bold">
            Frequently asked question <span className="text-sm font-normal italic text-gray-500">(optional)</span>
          </h3>
          <p>These FAQs will show as part of your space listing.</p>
          <div>
            {fields.map((field, index) => (
              <div
                className="p-[20px]"
                key={field.id}
              >
                <div className="flex justify-between">
                  <label className="mb-1 font-semibold">* Question #{index + 1}</label>
                  <button
                    className="text-sm font-semibold text-[#667085]"
                    onClick={() => remove(index)}
                  >
                    Delete
                  </button>
                </div>
                <input
                  placeholder=""
                  autoComplete="off"
                  {...register(`faqs.${index}.question`)}
                  className={`mb-4 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-primary`}
                />
                <br />
                <label className="mb-2 font-semibold">* Answer #{index + 1}</label>
                <SunEditor
                  width="100%"
                  height="107px"
                  onChange={(content) => setValue(`faqs.${index}.answer`, content)}
                  placeholder=""
                  hideToolbar={true}
                  setOptions={{ resizingBar: false }}
                  defaultValue={getValues().faqs[index].answer}
                />
              </div>
            ))}

            <button
              className="mb-12 font-bold text-[#1570EF]"
              type="button"
              id="append_faq_btn"
              // add logic to handle appending new FAQs field
            >
              + Add question
            </button>
          </div>
        </div>
        <hr className="my-[20px]" />
        <p className="px-4 text-sm md:px-0" dangerouslySetInnerHTML={{ __html: sanitizeAndTruncate(cancellationPolicy, 400) }}>
        </p>
        <div className="flex justify-end">
          <Link to={"/help/cancellation-policy"}
            className="mt-4 text-end text-sm font-semibold underline"
            target={"_blank"}
          >
            View More
          </Link>
        </div>
        <hr className="my-[30px]" />
        <button
          type="submit"
          className="login-btn-gradient rounded py-2 px-4 tracking-wide text-white outline-none focus:outline-none"
        >
          Continue
        </button>
        <br />
        <div
          className={`${showAddAmenitiesPopup ? "flex" : "hidden"} popup-container items-center justify-center normal-case`}
          onClick={() => setAddAmenitiesPopup(false)}
        >
          <div
            className={`${addAmenitiesPopup ? "pop-in" : "pop-out"} w-[510px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <h3 className="mb-[8px] text-2xl font-semibold">Select Amenities</h3>
              <button
                type="button"
                onClick={() => setAddAmenitiesPopup(false)}
                className="rounded-full border p-1 px-3 text-2xl font-normal duration-100 hover:bg-gray-200 active:bg-gray-300"
              >
                &#x2715;
              </button>
            </div>
            <div className="review-scroll max-h-[400px] overflow-y-auto">
            {isCatOthers() ?
              amenities.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((am) => (
                  <div
                    key={am.id}
                    className="checkbox-container mb-4"
                  >
                    <input
                      type="checkbox"
                      className=""
                      {...register("amenities")}
                      id={"amenity" + am.id}
                      value={am.id}
                    />
                    <label htmlFor={"amenity" + am.id}>{am.name}</label>
                  </div>
                ))
              :
              amenities.filter((am) => (am.space_id === Number(spaceData.category)) || am.creator_id === Number(localStorage.getItem("user"))).sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((am) => (
                <div
                  key={am.id}
                  className="checkbox-container mb-4"
                >
                  <input
                    type="checkbox"
                    className=""
                    {...register("amenities")}
                    id={"amenity" + am.id}
                    value={am.id}
                  />
                  <label htmlFor={"amenity" + am.id}>{am.name}</label>
                </div>
              ))
              }
            </div>
          </div>
        </div>
        <div
          className={`${showAddAddonsPopup ? "flex" : "hidden"} popup-container items-center justify-center normal-case`}
          onClick={() => setAddAddonsPopup(false)}
        >
          <div
            className={`${addAddonsPopup ? "pop-in" : "pop-out"} w-[510px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <h3 className="mb-[8px] text-2xl font-semibold">Select Addons</h3>
              <button
                type="button"
                onClick={() => setAddAddonsPopup(false)}
                className="rounded-full border p-1 px-3 text-2xl font-normal duration-100 hover:bg-gray-200 active:bg-gray-300"
              >
                &#x2715;
              </button>
            </div>
            <div className="review-scroll max-h-[400px] overflow-y-auto">
              {isCatOthers() ?
              addons.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((addon) => (
                <div
                  key={addon.id}
                  className="checkbox-container mb-4"
                >
                  <input
                    type="checkbox"
                    {...register("addons")}
                    id={"addon" + addon.id}
                    value={addon.id}
                  />
                  <label htmlFor={"addon" + addon.id}>{addon.name}{" "}${addon.cost}</label>
                </div>
              ))
              :
              addons.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).filter((ad) => ad.space_id === Number(spaceData.category) || ad.creator_id === Number(localStorage.getItem("user")))
              .map((addon) => (
                <div
                  key={addon.id}
                  className="checkbox-container mb-4"
                >
                  <input
                    type="checkbox"
                    {...register("addons")}
                    id={"addon" + addon.id}
                    value={addon.id}
                  />
                  <label htmlFor={"addon" + addon.id}>{addon.name}{" "}${addon.cost}</label>
                </div>
              ))
              
            }
            </div>
          </div>
        </div>
        <button
          type="button"
          id="save-as-draft"
          className="mt-[24px] rounded border-2 border-[#98A2B3] py-2 px-4 tracking-wide outline-none focus:outline-none"
          onClick={() => onSaveDraft()}
        >
          Save draft and exit
        </button>
      </form>

      {addOnModal &&
      <HostAddAddonsModal setAddOnModal={setAddOnModal}/>
    }
    </div>
  );
};

export default SpaceDetailsTwo;
