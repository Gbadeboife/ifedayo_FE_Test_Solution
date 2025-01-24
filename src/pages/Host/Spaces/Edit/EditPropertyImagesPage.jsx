import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { useFieldArray, useForm } from "react-hook-form";
import * as yup from "yup";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { Navigate, useNavigate, useOutletContext, useParams } from "react-router";
import { useEffect } from "react";
import MkdSDK from "@/utils/MkdSDK";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import { Link, useSearchParams } from "react-router-dom";
import { callCustomAPI } from "@/utils/callCustomAPI";
import axios from "axios";
import { DRAFT_STATUS, IMAGE_STATUS, NOTIFICATION_STATUS, NOTIFICATION_TYPE } from "@/utils/constants";
import CustomSelectV2 from "@/components/CustomSelectV2";
import { usePropertyAddons, usePropertySpace, usePropertySpaceAmenities, usePropertySpaceFaqs } from "@/hooks/api";
import useAmenityCategories from "@/hooks/api/useAmenityCategories";
import useAddonCategories from "@/hooks/api/useAddonCategories";
import { useSpaceContext } from "./spaceContext";
import useCancellation from "@/hooks/api/useCancellation";
import { sanitizeAndTruncate } from "@/utils/utils";
import CircleCheckIcon from "@/components/frontend/icons/CircleCheckIcon";


const EditPropertyImagesPage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") ?? "edit";
  const [draftType, setDraftType] = useState("");
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { spaceData, dispatch } = useSpaceContext();
  const [pictures, setPictures] = useState([null, null, null, null, null, null]);
  const { id } = useParams();
  const { propertySpace, notFound } = usePropertySpace(id);

  const [addAmenitiesPopup, setAddAmenitiesPopup] = useState(false);
  const showAddAmenitiesPopup = useDelayUnmount(addAmenitiesPopup, 100);
  const [addAddonsPopup, setAddAddonsPopup] = useState(false);
  const showAddAddonsPopup = useDelayUnmount(addAddonsPopup, 100);
  const [scheduleTemplate, setScheduleTemplate] = useState({});
  const cancellationPolicy = useCancellation();

  const amenities = useAmenityCategories(propertySpace.space_id, propertySpace.category === "Others" ? true : false);
  const addons = useAddonCategories(propertySpace.space_id,  propertySpace.category === "Others" ? true : false);

  const propertyAmenities = usePropertySpaceAmenities(id);
  const propertyAddons = usePropertyAddons(propertySpace.property_id);
  const propertyFaqs = usePropertySpaceFaqs(id);

  const [pictureIds, setPictureIds] = useState([]);

  const sdk = new MkdSDK();

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
    defaultValues: {
      amenities: [],
      addons: [],
      faqs: [],
      thumbnail: "",
    },
  });

  const selectedAmenities = watch("amenities");
  const selectedAddons = watch("addons");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "faqs",
  });

  async function getFileFromUrl(url) {
    if (url.photo_url === undefined) return null;
    const filename = url.photo_url.substring(url.photo_url.lastIndexOf("/") + 1);
    let response = await sdk.fetchImage(filename)
    let data = await response.blob();
    let metadata = {
      type: url.default_image,
    };
    return new File([data], url.photo_url.split("/").pop(), metadata);
  }

  const readImage = (file, previewEl) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById(previewEl).src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

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

  async function changeDraftStatus(space_id, newStatus) {
    try {
      const result = await axios.post(
        "https://ergo.mkdlabs.com/rest/property_spaces/PUT",
        { id: Number(space_id), draft_status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-project": "ZXJnbzprNWdvNGw1NDhjaDRxazU5MTh4MnVsanV2OHJxcXAyYXM",
          },
        },
      );
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

  const onSubmit = async (data) => {
    globalDispatch({ type: "START_LOADING" });
    var addonsToCreate = data.addons.filter((addon) => !propertyAddons.map((addon) => String(addon.add_on_id)).includes(addon));
    var addonsToDelete = propertyAddons.filter((addon) => !data.addons.includes(String(addon.add_on_id))).map((addon) => addon.id);

    var amenitiesToCreate = data.amenities.filter((am) => !propertyAmenities.map((am) => String(am.amenity_id)).includes(am));
    var amenitiesToDelete = propertyAmenities.filter((am) => !data.amenities.includes(String(am.amenity_id))).map((am) => am.id);

    var faqsToCreate = data.faqs.filter((faq) => !propertyFaqs.map((faq) => JSON.stringify(faq)).includes(JSON.stringify(faq)));
    var faqsToDelete = propertyFaqs.filter((faq) => !data.faqs.map((faq) => JSON.stringify(faq)).includes(JSON.stringify(faq))).map((faq) => faq.id);

    try {
      globalDispatch({ type: "SET_DETAILS_TWO", payload: { faqs: data.faqs, amenities: data.amenities, addons: data.addons } });

      // create property add ons
      sdk.setTable("property_add_on");
      for (let i = 0; i < addonsToCreate.length; i++) {
        const add_on_id = addonsToCreate[i];
        await sdk.callRestAPI(
          {
            property_id: propertySpace?.property_id,
            add_on_id,
          },
          "POST",
        );
      }
      // delete addons
      sdk.setTable("property_add_on");
      for (let i = 0; i < addonsToDelete.length; i++) {
        const id = addonsToDelete[i];
        await sdk.callRestAPI({ id }, "DELETE");
      }

      // create property space amenities
      sdk.setTable("property_spaces_amenitites");
      for (let i = 0; i < amenitiesToCreate.length; i++) {
        const amenity_id = amenitiesToCreate[i];
        await sdk.callRestAPI(
          {
            property_spaces_id: id,
            amenity_id,
          },
          "POST",
        );
      }

      // delete property space amenities
      sdk.setTable("property_spaces_amenitites");
      for (let i = 0; i < amenitiesToDelete.length; i++) {
        const id = amenitiesToDelete[i];
        await sdk.callRestAPI({ id }, "DELETE");
      }

      // create property space faqs
      sdk.setTable("property_space_faq");
      for (let i = 0; i < faqsToCreate.length; i++) {
        const faq = faqsToCreate[i];
        await sdk.callRestAPI(
          {
            property_space_id: id,
            question: faq.question,
            answer: faq.answer,
          },
          "POST",
        );
      }

      // delete property space faqs
      sdk.setTable("property_space_faq");
      for (let i = 0; i < faqsToDelete.length; i++) {
        const id = faqsToDelete[i];
        await sdk.callRestAPI({ id }, "DELETE");
      }

      let pictureAddedCount = 0;

      // create property space images
      for (let i = 0; i < pictures.length; i++) {
        sdk.setTable("property_spaces_images");
        const file = pictures[i];

        const upload = await handleImageUpload(file);
        if (upload.id) {
          await sdk.callRestAPI(
            {
              property_id: propertySpace?.property_id,
              property_spaces_id: id,
              photo_id: upload.id,
              is_approved: file?.name == data.thumbnail ? IMAGE_STATUS.APPROVED : IMAGE_STATUS.NOT_APPROVED,
            },
            "POST",
          );
          pictureAddedCount++;
        }
        if (file?.name == data.thumbnail) {
          sdk.setTable("property_spaces");
          await sdk.callRestAPI(
            {
              id,
              default_image_id: upload.id,
            },
            "PUT",
          );
        }
      }

      if (pictureAddedCount > 0) {
        // create notification
        sdk.setTable("notification");
        await sdk.callRestAPI(
          {
            user_id: localStorage.getItem("user"),
            action_id: id,
            actor_id: null,
            notification_time: new Date().toISOString().split(".")[0],
            message: "New Property Space Images Added",
            type: NOTIFICATION_TYPE.CREATE_PROPERTY_SPACE_IMAGE,
            status: NOTIFICATION_STATUS.NOT_ADDRESSED,
          },
          "POST",
        );
      }

      // delete previous space images
      sdk.setTable("property_spaces_images");
      for (let i = 0; i < pictureIds.length; i++) {
        const id = pictureIds[i];
        sdk.callRestAPI({ id }, "DELETE");
      }
      if (mode == "create") {
        await changeDraftStatus(id, DRAFT_STATUS.IMAGES);
      }
      if (draftType === "continue") {
        navigate(`/account/my-spaces/${id}/edit-scheduling?mode=edit`, { state: scheduleTemplate });
      } else {
        navigate(`/account/my-spaces/${id}`);
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
    globalDispatch({ type: "STOP_LOADING" });
  };

  async function fetchPropertySpaceImages() {
    const ctrl = new AbortController();
    const where = [`property_spaces_id = ${id} AND ergo_property_spaces_images.deleted_at IS NULL`];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/property-space-images/PAGINATE", { page: 1, limit: 7, where }, "POST", ctrl.signal);
      if (Array.isArray(result.list)) {
        setPictureIds(result.list.map((pic) => pic.id));
        for (let i = 0; i < result.list.length; i++) {
          const url = result.list[i];
          const picFile = await getFileFromUrl(url);
          setPictures((prev) => {
            var copy = [...prev];
            copy[i] = picFile;
            return copy;
          });
        }
      }
    } catch (err) {
      console.log(err)
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
    fetchPropertySpaceImages()
    fetchScheduleTemplate(id);
  }, [])

  useEffect(() => {
    if (amenities.length && propertyAmenities.length) {
      setValue(
        "amenities",
        propertyAmenities.map((am) => String(am.amenity_id)),
      );
    }
  }, [amenities, propertyAmenities]);

  useEffect(() => {
    if (addons.length && propertyAddons.length) {
      setValue(
        "addons",
        propertyAddons.map((addon) => String(addon.add_on_id)),
      );
    }
  }, [addons, propertyAddons]);

  useEffect(() => {
    if (propertyFaqs.length) {
      setValue("faqs", propertyFaqs);
    }
  }, [propertyFaqs]);

  if (notFound) return <Navigate to="/not-found" />;

  return (
    <div className="min-h-screen max-w-[656px] pb-40">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1 className="mb-8 px-4 text-4xl font-bold md:px-0">Edit Space Images, Faqs, Addons & Amenities</h1>
        <div className="px-[20px] py-[32px]">
          <h3 className="text-2xl font-semibold">* Photographs of the space</h3>
          <p className="mb-8">Provide additional information on the files. file type, max size, suggest resolution etc.</p>
          <div className="mb-8 flex flex-wrap gap-x-2 gap-y-4 md:gap-5">
            {pictures.map((file, idx) => {
              return (
                <FileUploader
                  multiple={false}
                  handleChange={(file) => {
                    setPictures((prev) => {
                      const copy = [...prev];
                      copy[idx] = file;
                      return copy;
                    });
                  }}
                  types={["JPEG", "PNG", "JPG"]}
                  fileOrFiles={file}
                  key={idx}
                >
                  <div
                    className="flex h-[120px] w-[150px] max-w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D0D5DD] text-sm md:w-[189px]"
                    key={idx}
                  >
                    {pictures[idx]?.name ? (
                      <img
                        src={readImage(pictures[idx], `preview-${idx}`)}
                        id={`preview-${idx}`}
                        className="h-full w-full rounded-sm object-cover"
                      />
                    ) : (
                      <h4 className={`break-all  text-xl text-[#98A2B3]`}>+ Add Image</h4>
                    )}
                  </div>
                </FileUploader>
              );
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
          <button
            type="button"
            className="mb-2 font-bold text-[#1570EF]"
            onClick={() => setAddAmenitiesPopup(true)}
          >
            + Select items
          </button>
          <div className="amenities-grid mb-12">
            {amenities
              .filter((am) => {
                if (Array.isArray(selectedAmenities)) {
                  return selectedAmenities?.includes(String(am.id));
                }
                return false;
              })
              .map((am) => (
                <li key={am.id} className="flex items-center gap-4">
                  <CircleCheckIcon />{am.name}</li>
              ))}
          </div>
          <h3 className="mb-4 text-xl font-bold">
            Add-ons <span className="text-sm font-normal italic text-gray-500">(optional)</span>
          </h3>
          <button
            type="button"
            className="mb-2 font-bold text-[#1570EF]"
            onClick={() => setAddAddonsPopup(true)}
          >
            + Select items
          </button>
          <div className="amenities-grid mb-12">
            {addons
              .filter((addon) => {
                if (Array.isArray(selectedAddons)) {
                  return selectedAddons?.includes(String(addon.id));
                }
                return false;
              })
              .map((addon) => (
                <li key={addon.id} className="flex items-center gap-4">
                  <CircleCheckIcon />{addon.name}
                </li>
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
                  <label className="font-semibold">* Question #{index + 1}</label>
                  <button
                    className="text-sm font-semibold text-[#667085]"
                    onClick={() => remove(index)}
                  >
                    Delete
                  </button>
                </div>
                <input
                  placeholder=""
                  {...register(`faqs.${index}.question`)}
                  className={`"shadow focus:shadow-outline mb-4 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none`}
                />
                <br />
                <label className="font-semibold">* Answer #{index + 1}</label>
                <br />
                <SunEditor
                  width="100%"
                  height="107px"
                  onChange={(content) => setValue(`faqs.${index}.answer`, content)}
                  placeholder=""
                  hideToolbar={true}
                  setOptions={{ resizingBar: false, fontSize: 16 }}
                  defaultValue={getValues().faqs[index].answer}
                />
              </div>
            ))}

            <button
              className="mb-12 font-bold text-[#1570EF]"
              type="button"
              onClick={() => append({ question: "", answer: "" })}
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
          onClick={() => setDraftType("continue")}
          type="submit"
          className="login-btn-gradient rounded py-2 px-4 tracking-wide text-white outline-none focus:outline-none"
        >
          Continue
        </button>
        <br />
        <button
          onClick={() => setDraftType("submit")}
          type="submit"
          className="login-btn-gradient ml-4 mt-3 rounded py-2 px-4 tracking-wide text-white outline-none focus:outline-none md:ml-0"
        >
          Save
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
              >
                &#10006;
              </button>
            </div>
            <div className="review-scroll max-h-[400px] overflow-y-auto">
              {amenities.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((am) => (
                <div
                  key={am.id}
                  className="checkbox-container mb-4"
                >
                  <input
                    type="checkbox"
                    {...register("amenities")}
                    id={"amenity" + am.id}
                    value={am.id}
                  />
                  <label htmlFor={"amenity" + am.id}>{am.name}</label>
                </div>
              ))}
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
              >
                &#10006;
              </button>
            </div>
            <div className="review-scroll max-h-[400px] overflow-y-auto">
              {addons.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((addon) => (
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
                  <label htmlFor={"addon" + addon.id}>{addon.name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditPropertyImagesPage;
