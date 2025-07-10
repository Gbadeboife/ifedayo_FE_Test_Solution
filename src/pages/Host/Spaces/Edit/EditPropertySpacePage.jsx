import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import React from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import { useSearchParams } from "react-router-dom";
import { SPACE_CATEGORY_SIZES, NOTIFICATION_STATUS, NOTIFICATION_TYPE, SPACE_STATUS } from "@/utils/constants";
import CustomLocationAutoCompleteV2 from "@/components/CustomLocationAutoCompleteV2";
import CustomSelectV2 from "@/components/CustomSelectV2";
import CounterV2 from "@/components/CounterV2";
import { AuthContext, tokenExpireError } from "@/authContext";
import CustomComboBox from "@/components/CustomComboBox";
import countries from "@/utils/countries.json";
import { useSpaceContext } from "./spaceContext";
import { extractLocationInfo } from "@/utils/utils";
const sdk = new MkdSDK();
const ctrl = new AbortController();

const EditPropertySpacePage = () => {
  const { dispatch: authDispatch } = useContext(AuthContext);
  const { spaceData, dispatch } = useSpaceContext();
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const { id } = useParams();
  const [currSpace, setCurrSpace] = useState({});
  const [draftType, setDraftType] = useState("");

  const schema = yup.object({
    category: yup.string(),
    name: yup.string().required("This field is required"),
    address_line_1: yup.string().required("This field is required"),
    address_line_2: yup.string(),
    city: yup.string().required("This field is required"),
    zip: yup.string(),
    rate: yup.number().typeError("Must be a number").positive().integer(),
    description: yup.string().required("This field is required"),
    rule: yup.string(),
    max_capacity: yup.number().required("This field is required").min(1).typeError("This field is required"),
    additional_guest_rate: yup.string(),
  });

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      category: "",
      id: "",
      name: "",
      rate: "",
      max_capacity: 0,
      description: "",
      rule: "",
      zip: "",
      country: "",
      city: "",
      address_line_1: "",
      address_line_2: "",
      additional_guest_rate: "",
      size: 0,
    },
    mode: "all",
  });

  async function fetchCurrSpace() {
    const where = [`ergo_property_spaces.id = ${id}`];
    const user_id = localStorage.getItem("user");
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/popular/PAGINATE", { page: 1, limit: 1, user_id: Number(user_id), where, all: true }, "POST", ctrl.signal);
      if (Array.isArray(result.list) && result.list.length > 0) {
        setCurrSpace(result.list[0]);
      }
    } catch (err) {
      tokenExpireError(authDispatch, err.message);
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

  useEffect(() => {
    if (mode == "edit") {
      fetchCurrSpace();
    }
  }, []);

  useEffect(() => {
    if (currSpace && Object.keys(currSpace).length > 0) {
      setValue("name", currSpace.name || "");
      setValue("address_line_1", currSpace.address_line_1 || "");
      setValue("address_line_2", currSpace.address_line_2 || "");
      setValue("city", currSpace.city || "");
      setValue("zip", currSpace.zip || "");
      setValue("category", currSpace.space_id?.toString() || "");
      setValue("rate", currSpace.rate || "");
      setValue("description", currSpace.description || "");
      setValue("rule", currSpace.rule || "");
      setValue("max_capacity", currSpace.max_capacity || 0);
      setValue("additional_guest_rate", currSpace.additional_guest_rate || "");
      setValue("size", currSpace.size || 0);
      setValue("id", currSpace.id || "");
    }
  }, [currSpace, setValue]);

  const onSubmit = async (data) => {
    const result = extractLocationInfo(data?.city)
    data.city = (result[0]);
    data.country = (result[1]);
    console.log("submitting", data);
    const host_id = localStorage.getItem("user");
    globalDispatch({ type: "START_LOADING" });

    try {
      if (mode == "edit") {
        sdk.setTable("property");
        await sdk.callRestAPI(
          {
            id: currSpace.property_id,
            address_line_1: data.address_line_1,
            address_line_2: data.address_line_2,
            city: data.city,
            country: data.country,
            zip: data.zip,
            status: 0,
            verified: 0,
            host_id,
            name: data.name,
            rule: data.rule,
          },
          "PUT",
        );

        sdk.setTable("property_spaces");
        const propertySpaceResult = await sdk.callRestAPI(
          {
            id,
            property_id: currSpace.property_id,
            space_id: data.category,
            max_capacity: data.max_capacity,
            description: data.description,
            rate: data.rate,
            space_status: SPACE_STATUS.UNDER_REVIEW,
            additional_guest_rate: data.additional_guest_rate,
            size: hasSizes ? data.size : SPACE_CATEGORY_SIZES.UNSET,
          },
          "PUT",
        );

        // create notification
        sdk.setTable("notification");
        await sdk.callRestAPI(
          {
            user_id: host_id,
            actor_id: null,
            action_id: propertySpaceResult.message,
            notification_time: new Date().toISOString().split(".")[0],
            message: "Property Space Edited",
            type: NOTIFICATION_TYPE.EDIT_PROPERTY_SPACE,
            status: NOTIFICATION_STATUS.NOT_ADDRESSED,
          },
          "POST",
        );
      }
      if (draftType === "continue") {
        navigate(`/account/my-spaces/${getValues("id")}/edit-images?mode=edit`);
      } else {
        navigate(-1);
      }
    } catch (err) {
      tokenExpireError(authDispatch, err.message);
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Edit Space Failed", message: err.message } });
    }
    globalDispatch({ type: "STOP_LOADING" });
  };

  const SIZES = [
    { label: "All", value: SPACE_CATEGORY_SIZES.UNSET },
    { label: "Small", value: SPACE_CATEGORY_SIZES.SMALL },
    { label: "Medium", value: SPACE_CATEGORY_SIZES.MEDIUM },
    { label: "Large", value: SPACE_CATEGORY_SIZES.LARGE },
    { label: "X-Large", value: SPACE_CATEGORY_SIZES.X_LARGE },
  ];
  const category = watch("category");
  const hasSizes = globalState.spaceCategories.find((ctg) => ctg.id == Number(category))?.has_sizes == 1;

  return (
    <div className="min-h-screen pb-40">
      <form
        className="text-sm md:max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">Space Details</h1>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="name"
          >
            Property name {errors.name?.message ? <span className="text-xs font-normal italic text-red-500">{errors.name?.message}</span> : ""}
          </label>
          <input
            autoComplete="off"
            placeholder=""
            {...register("name")}
            className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.name?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
          />
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="address_line_1"
          >
            Address Line 1 {errors.address_line_1?.message ? <span className="text-xs font-normal italic text-red-500">{errors.address_line_1?.message}</span> : ""}
          </label>
          <CustomLocationAutoCompleteV2
            control={control}
            setValue={(val) => setValue("address_line_1", val)}
            name="address_line_1"
            className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.address_line_1?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            placeholder=""
            hideIcons
            suggestionType={["(cities)"]}
          />
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="address_line_2"
          >
            Address Line 2 {errors.address_line_2?.message ? <span className="text-xs font-normal italic text-red-500">{errors.address_line_2?.message}</span> : ""}
          </label>
          <CustomLocationAutoCompleteV2
            control={control}
            setValue={(val) => setValue("address_line_2", val)}
            name="address_line_2"
            className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.address_line_2?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            placeholder=""
            hideIcons
            suggestionType={["(cities)"]}
          />
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="city"
          >
            City {errors.city?.message ? <span className="text-xs font-normal italic text-red-500">{errors.city?.message}</span> : ""}
          </label>
          <CustomLocationAutoCompleteV2
            control={control}
            setValue={(val) => setValue("city", val)}
            name="city"
            className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.city?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            placeholder=""
            hideIcons
            suggestionType={["(cities)"]}
          />
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="zip"
          >
            Zip code {errors.zip?.message ? <span className="text-xs font-normal italic text-red-500">{errors.zip?.message}</span> : ""}
          </label>
          <input
            placeholder=""
            {...register("zip")}
            className={` focus:shadow-outline $ w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.zip?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"
              }`}
          />
        </div>
        
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="category"
          >
            Category {errors.category?.message ? <span className="text-xs font-normal italic text-red-500">{errors.category?.message}</span> : ""}
          </label>
          <CustomSelectV2
            items={globalState.spaceCategories}
            labelField="category"
            valueField="id"
            containerClassName=""
            className={`w-full border py-2 px-3 ${errors.category?.message ? "ring-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            openClassName="ring-primary ring-2"
            placeholder={"Select a category"}
            control={control}
            name="category"
          />
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="rate"
          >
            Hourly rate {errors.rate?.message ? <span className="text-xs font-normal italic text-red-500">{errors.rate?.message}</span> : ""}
          </label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-4 text-sm">&#36;</span>
            <input
              placeholder=""
              type="number"
              {...register("rate")}
              className={`remove-arrow focus:shadow-outline w-full rounded rounded-l-none border py-2 px-3 leading-tight text-gray-700 ${errors.rate?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"
                }`}
            />
          </div>
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="description"
          >
            Description {errors.description?.message ? <span className="text-xs font-normal italic text-red-500">{errors.description?.message}</span> : ""}
          </label>
          <textarea
            placeholder=""
            {...register("description")}
            className={`w-full resize-none rounded border py-2 px-3 leading-tight text-gray-700 ${errors.description?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"
              }`}
            rows={10}
          ></textarea>
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="rule"
          >
            Property rules
          </label>
          <textarea
            placeholder=""
            {...register("rule")}
            className={`w-full resize-none rounded border py-2 px-3 leading-tight text-gray-700 ${errors.rule?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            rows={10}
          ></textarea>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <p className="font-semibold">* Max number of guests {errors.max_capacity?.message ? <span className="text-xs font-normal italic text-red-500">{errors.max_capacity?.message}</span> : ""}</p>
          <CounterV2
            name="max_capacity"
            control={control}
            setValue={(val) => setValue("max_capacity", val)}
          />
        </div>
        {hasSizes && (
          <div className={`mb-8`}>
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="size"
            >
              Size (<span className="text-sm font-normal italic">optional </span>) {errors.size?.message ? <span className="text-xs font-normal italic text-red-500">{errors.size?.message}</span> : ""}
            </label>
            <CustomSelectV2
              shouldUnregister={false}
              items={SIZES}
              labelField="label"
              valueField="value"
              containerClassName=""
              className={`w-full border py-2 px-3 ${errors.size?.message ? "ring-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
              openClassName="ring-primary ring-2"
              placeholder={"Select size"}
              control={control}
              name="size"
            />
          </div>
        )}

        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="additional_guest_rate"
          >
            Hourly rate for additional {hasSizes ? "guests" : "guests"} (<span className="text-sm font-normal italic">optional </span>){" "}
            {errors.additional_guest_rate?.message ? <span className="text-xs font-normal italic text-red-500">{errors.additional_guest_rate?.message}</span> : ""}
          </label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-4 text-sm">&#36;</span>
            <input
              placeholder=""
              type="number"
              {...register("additional_guest_rate")}
              className={`remove-arrow w-full rounded rounded-l-none border py-2 px-3 leading-tight text-gray-700 ${errors.additional_guest_rate?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"
                }`}
            />
          </div>
        </div>
        <hr className="my-[48px]" />
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
          className="login-btn-gradient rounded py-2 mt-3 px-4 tracking-wide text-white outline-none focus:outline-none"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default EditPropertySpacePage;
