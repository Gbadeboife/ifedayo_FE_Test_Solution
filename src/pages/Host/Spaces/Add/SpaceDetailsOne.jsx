import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { useForm } from "react-hook-form";
import { useSpaceContext } from "./spaceContext";
import MkdSDK from "@/utils/MkdSDK";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import { SPACE_CATEGORY_SIZES, DRAFT_STATUS, SPACE_STATUS, SPACE_VISIBILITY } from "@/utils/constants";
import CustomLocationAutoCompleteV2 from "@/components/CustomLocationAutoCompleteV2";
import CustomComboBox from "@/components/CustomComboBox";
import countries from "@/utils/countries.json";
import CustomSelectV2 from "@/components/CustomSelectV2";
import CounterV2 from "@/components/CounterV2";
import SelectRuleTemplate from "./SelectRuleTemplate";
import { extractLocationInfo } from "@/utils/utils";
const sdk = new MkdSDK();

const AddSpacePage = () => {
  const { spaceData, dispatch } = useSpaceContext();
  const { ruleTemplates } = useOutletContext();
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const [selectRuleTemplateModal, setSelectRuleTemplateModal] = useState(false);
  const schema = yup.object({
    category: yup.string().required("This field is required"),
    name: yup.string().required("This field is required"),
    address_line_1: yup.string().required("This field is required"),
    address_line_2: yup.string(),
    city: yup.string().required("This field is required"),
    zip: yup.string(),
    rate: yup.number().typeError("Must be a number").positive().integer(),
    description: yup.string().required("This field is required"),
    rule: yup.string(),
    max_capacity: yup.number().required("This field is required").min(1, "Max capacity must be greater than 0").typeError("This field is required"),
    additional_guest_rate: yup.number().typeError("Must be a number").positive().integer(),
  });

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ...spaceData,
      category: Number(spaceData.category)
    },
    mode: "all",
  });

  const formValues = watch();

  const onSubmit = async (data) => {
    const result = extractLocationInfo(data?.city)
    data.city = (result && result[0]);
    data.country = (result && result[1]);
    console.log("submitting", data);
    dispatch({ type: "SET_DETAILS_ONE", payload: { ...data, amenities: [], addons: [] } });
    navigate("/spaces/add/2");
  };

  const onSaveDraft = async () => {
    const host_id = localStorage.getItem("user");

    const result = extractLocationInfo(formValues.city)
    formValues.city = (result[0]);
    formValues.country = (result[1]);

    const formIsValid = await trigger();
    if (!formIsValid) return;

    globalDispatch({ type: "START_LOADING" });
    var propertyResult;
    try {
      // create property if needed
      if (!spaceData.property_id) {
        sdk.setTable("property");
        propertyResult = await sdk.callRestAPI(
          {
            address_line_1: formValues.address_line_1,
            address_line_2: formValues.address_line_2,
            city: formValues.city,
            country: formValues.country,
            zip: formValues.zip,
            status: 1,
            verified: 1,
            host_id,
            name: formValues.name,
            rule: formValues.rule,
          },
          "POST",
        );
        dispatch({ type: "SET_PROPERTY_ID", payload: propertyResult?.message });
      }

      // create space
      sdk.setTable("property_spaces");
      await sdk.callRestAPI(
        {
          property_id: propertyResult?.message ?? spaceData.property_id,
          space_id: formValues.category,
          max_capacity: formValues.max_capacity,
          description: formValues.description,
          rate: formValues.rate,
          space_status: SPACE_STATUS.UNDER_REVIEW,
          availability: SPACE_VISIBILITY.VISIBLE,
          draft_status: DRAFT_STATUS.PROPERTY_SPACE,
          size: hasSizes ? formValues.size : SPACE_CATEGORY_SIZES.UNSET,
          additional_guest_rate: formValues.additional_guest_rate || undefined,
        },
        "POST",
      );

      navigate("/account/my-spaces");
    } catch (err) {
      if (err.message == "Validation Error") {
        globalDispatch({
          type: "SHOW_ERROR",
          payload: {
            heading: "Operation failed!!",
            message: `Space category "${globalState.spaceCategories.find((cat) => cat.id == formValues.category)?.category}" already exists for property "${formValues.name}"`,
          },
        });
      }
    }
    globalDispatch({ type: "STOP_LOADING" });
  };

  const hasSizes = globalState.spaceCategories.find((ctg) => ctg.id == Number(formValues.category))?.has_sizes == 1;
  const SIZES = [
    { label: "All", value: SPACE_CATEGORY_SIZES.UNSET },
    { label: "Small", value: SPACE_CATEGORY_SIZES.SMALL },
    { label: "Medium", value: SPACE_CATEGORY_SIZES.MEDIUM },
    { label: "Large", value: SPACE_CATEGORY_SIZES.LARGE },
    { label: "X-Large", value: SPACE_CATEGORY_SIZES.X_LARGE },
  ];

  return (
    <div className="min-h-screen pb-40">
      <form
        className="text-sm md:max-w-lg fifteen-ste"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <h1 className="mb-0 text-3xl font-bold md:text-4xl">Space Details</h1>
        <p className="mb-8"><small>Fields marked with an asterisk are required</small></p>
        <div className="mb-8 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="name"
          >
            Property name <span className="text-red-700">*</span> {errors.name?.message ? <span className="text-xs font-normal italic text-red-500">{errors.name?.message}</span> : ""}
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
            Address Line 1 <span className="text-red-700">*</span> {errors.address_line_1?.message ? <span className="text-xs font-normal italic text-red-500">{errors.address_line_1?.message}</span> : ""}
          </label>
          <CustomLocationAutoCompleteV2
            control={control}
            setValue={(val) => setValue("address_line_1", val)}
            name="address_line_1"
            className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.address_line_1?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            placeholder=""
            hideIcons
            suggestionType={["address"]}
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
            suggestionType={["address"]}
          />
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="city"
          >
            City <span className="text-red-700">*</span> {errors.city?.message ? <span className="text-xs font-normal italic text-red-500">{errors.city?.message}</span> : ""}
          </label>
          <CustomLocationAutoCompleteV2
            control={control}
            setValue={(val) => setValue("city", val)}
            name="city"
            className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.city?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            placeholder=""
            hideIcons
          suggestionType={["(regions)"]}
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
            Category <span className="text-red-700">*</span> {errors.category?.message ? <span className="text-xs font-normal italic text-red-500">{errors.category?.message}</span> : ""}
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
            Hourly rate <span className="text-red-700">*</span> {errors.rate?.message ? <span className="text-xs font-normal italic text-red-500">{errors.rate?.message}</span> : ""}
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
            Description <span className="text-red-700">*</span> {errors.description?.message ? <span className="text-xs font-normal italic text-red-500">{errors.description?.message}</span> : ""}
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
            Property rules{" "}
            {ruleTemplates.length > 0 && (
              <button
                type="button"
                className="ml-8 text-gray-500 underline"
                onClick={() => setSelectRuleTemplateModal(true)}
              >
                Select from a template
              </button>
            )}
          </label>
          <textarea
            placeholder=""
            {...register("rule")}
            className={`w-full resize-none rounded border py-2 px-3 leading-tight text-gray-700 ${errors.rule?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            rows={10}
          ></textarea>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <p className="font-semibold">* Max number of guests <span className="text-red-700">*</span> {errors.max_capacity?.message ? <span className="text-xs font-normal italic text-red-500">{errors.max_capacity?.message}</span> : ""}</p>
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
          type="submit"
          className="login-btn-gradient rounded py-2 px-4 tracking-wide text-white outline-none focus:outline-none"
        >
          Continue
        </button>
        <br />
        <button
          type="button"
          id="save-as-draft"
          className="mt-[24px] rounded border-2 border-[#98A2B3] py-2 px-4 tracking-wide outline-none focus:outline-none"
          onClick={onSaveDraft}
        >
          Save draft and exit
        </button>
      </form>
      <SelectRuleTemplate
        isOpen={selectRuleTemplateModal}
        closeModal={() => setSelectRuleTemplateModal(false)}
        templates={ruleTemplates}
        onSelect={(val) => setValue("rule", val)}
      />
    </div>
  );
};

export default AddSpacePage;
