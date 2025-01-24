import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";
import SmartSearchV2 from "@/components/SmartSearchV2";
import TreeSDK from "@/utils/TreeSDK";

const treeSdk = new TreeSDK();
const AddAdminPropertySpacesPage = () => {
  const [spaces, setSpacesData] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState({});
  const [properties, setPropertyData] = useState([]);

  let sdk = new MkdSDK();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const schema = yup.object({
    max_capacity: yup.number().typeError("Max Capacity must be a number").required().positive().integer(),
    description: yup.string().required("Description is required"),
    rate: yup.number().typeError("Rate must be a number").required(),
    tax: yup.number().typeError("Tax must be a number").required(),
    availability: yup.number(),
    space_status: yup.number(),
    space_id: yup.number("Please select a space category").typeError("Please select a space category").required("Space category is required"),
    additional_guest_rate: yup.string(),
  });

  const { dispatch } = React.useContext(AuthContext);

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const space_id = watch("space_id");
  const hasSizes = spaces.find((sp) => sp.id == Number(space_id))?.has_sizes == 1;

  async function getPropertyData() {
    try {
      const result = await treeSdk.getList("property", { filter: ["deleted_at,is"], join: [] });
      const { list } = result;
      setPropertyData(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function getSpacesData() {
    try {
      const result = await treeSdk.getList("spaces", { filter: ["deleted_at,is"], join: [] });
      const { list } = result;
      setSpacesData(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }
  const onSubmit = async (data) => {
    if (!selectedProperty?.id) {
      setError("property_id", {
        type: "manual",
        message: "Please select a valid property",
      });
      return;
    }
    data.property_id = selectedProperty.id;
    try {
      sdk.setTable("property_spaces");
      const result = await sdk.callRestAPI(
        {
          property_id: data.property_id,
          space_id: data.space_id,
          max_capacity: data.max_capacity,
          description: data.description,
          rate: data.rate,
          tax: data?.tax,
          availability: data.availability,
          space_status: data.space_status,
          additional_guest_rate: data.additional_guest_rate || undefined,
          size: Number(data.size) || null,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/property_spaces");
      } else {
        if (result.validation) {
          const keys = Object.keys(result.validation);
          for (let i = 0; i < keys.length; i++) {
            const field = keys[i];
            setError(field, {
              type: "manual",
              message: result.validation[field],
            });
          }
        }
      }
    } catch (error) {
      console.log("Error", error);
      if (error.message == "Validation error") {
        setError("property_id", {
          type: "manual",
          message: "Property Space Already Exists!",
        });
      } else {
        setError("property_id", {
          type: "manual",
          message: error.message,
        });
      }
      tokenExpireError(dispatch, error.message);
    }
  };

  const onError = () => {
    if (!selectedProperty?.id) {
      setError("property_id", {
        type: "manual",
        message: "Please select a valid property",
      });
    }
  };

  useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces",
      },
    });
    (async function () {
      await getPropertyData();
      await getSpacesData();
    })();
  }, []);

  return (
    <AddAdminPageLayout
      title={"Property Space"}
      backTo={"property_spaces"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="property_id"
          >
            Property
          </label>
          <SmartSearchV2
            selected={selectedProperty}
            setSelected={setSelectedProperty}
            data={properties}
            fieldToDisplay="name"
          />
          <p className="text-xs normal-case italic text-red-500">{errors.property_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="space_id"
          >
            Space
          </label>
          <select
            className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.space_id?.message ? "border-red-500" : ""
              }`}
            {...register("space_id")}
          >
            <option value={""}>Select Space Category</option>
            {spaces.map((sp) => (
              <option
                key={sp.id}
                value={sp.id}
              >
                {sp.category}
              </option>
            ))}
          </select>
          <p className="text-xs normal-case italic text-red-500">{errors.space_id?.message}</p>
        </div>
        {hasSizes && (
          <div className="mb-4 ">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="size"
            >
              Size
            </label>
            <select
              className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.size?.message ? "border-red-500" : ""}`}
              {...register("size", { shouldUnregister: true })}
            >
              <option value={""}>Select Size</option>
              {["Small", "Medium", "Large", "X-Large"].map((size, idx) => (
                <option
                  key={size}
                  value={idx}
                >
                  {size}
                </option>
              ))}
            </select>
            <p className="text-xs normal-case italic text-red-500">{errors.size?.message}</p>
          </div>
        )}

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="max_capacity"
          >
            Max Capacity
          </label>
          <input
            placeholder="Max Capacity"
            {...register("max_capacity")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.max_capacity?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.max_capacity?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            placeholder="description"
            {...register("description")}
            className={`focus:shadow-outline  mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.description?.message ? "border-red-500" : ""}`}
            rows={15}
          ></textarea>
          <p className="text-xs normal-case italic text-red-500">{errors.description?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="rate"
          >
            Tax
          </label>
          <input
            placeholder="Tax"
            {...register("tax")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.rate?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.tax?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="rate"
          >
            Rate ( Hourly )
          </label>
          <input
            placeholder="Rate ( Hourly )"
            {...register("rate")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.rate?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.rate?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="additional_guest_rate"
          >
            Additional guests price ( Hourly )
          </label>
          <input
            placeholder="Rate for additional guests"
            {...register("additional_guest_rate")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.additional_guest_rate?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.additional_guest_rate?.message}</p>
        </div>

        <div className="mb-8 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="availability"
          >
            Visibility
          </label>

          <select
            name="availability"
            {...register("availability")}
            className="focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
          >
            <option value={0}>HIDDEN</option>
            <option value={1}>VISIBLE</option>
          </select>
          <p className="text-xs normal-case italic text-red-500">{errors.availability?.message}</p>
        </div>

        <div className="mb-8 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="space_status"
          >
            Status
          </label>

          <select
            name="space_status"
            {...register("space_status")}
            className="focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
          >
            <option value={0}>UNDER REVIEW</option>
            <option value={1}>APPROVED</option>
            <option value={1}>DECLINED</option>
          </select>
          <p className="text-xs normal-case italic text-red-500">{errors.space_status?.message}</p>
        </div>


        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/property_spaces")}
            className="mb-1 flex-1 rounded border border-[#667085] !bg-gradient-to-r px-6 py-2 text-sm font-semibold text-[#667085] outline-none focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ml-5 mb-1 flex-1 rounded !bg-gradient-to-r from-[#33D4B7]  to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
          >
            Save
          </button>
        </div>
      </form>
    </AddAdminPageLayout>
  );
};

export default AddAdminPropertySpacesPage;
