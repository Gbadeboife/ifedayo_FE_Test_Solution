import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import EditAdminPageLayout from "@/layouts/EditAdminPageLayout";
import SmartSearch from "@/components/SmartSearch";

let sdk = new MkdSDK();

const EditAdminPropertySpacesPage = () => {
  const { dispatch } = React.useContext(AuthContext);

  const [spaces, setSpacesData] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState({});
  const [properties, setPropertyData] = useState([]);
  const schema = yup
    .object({
      property_id: yup.number(),
      max_capacity: yup.number().required().positive().integer(),
      description: yup.string().required(),
      rate: yup.number().required(),
      tax: yup.number().typeError("Tax must be a number").required(),
      visibility: yup.number(),
      space_status: yup.number(),
      space_id: yup.number("Please select a space category").typeError("Please select a space category").required("Space category is required"),
      reason: yup.string().when("space_status", {
        is: (space_status) => {
          return space_status == 2;
        },
        then: yup.string().required("This field is required"),
        otherwise: yup.string().notRequired(),
      }),
      additional_guest_rate: yup.string(),
    })
    .required();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const [id, setId] = useState(0);
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

  const selectedSpaceStatus = watch("space_status");
  const space_id = watch("space_id");
  const hasSizes = spaces.find((sp) => sp.id == Number(space_id))?.has_sizes == 1;

  const params = useParams();
  const [initialSpaceStatus, setInitialSpaceStatus] = useState(null);

  async function getPropertyData(pageNum, limitNum, data) {
    try {
      sdk.setTable("property");
      const payload = { name: data.name || undefined };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limitNum,
        },
        "PAGINATE",
      );
      const { list } = result;
      setPropertyData(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function getSpacesData() {
    try {
      sdk.setTable("spaces");
      const result = await sdk.callRestAPI({}, "GETALL");
      const { list } = result;
      setSpacesData(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function sendEmailToHost(propertySpace, message) {
    sdk.setTable("user");
    try {
      // get user email
      const result = await sdk.callRestAPI({ id: propertySpace.host_id }, "GET");
      var email = result.model.email;
      const emailResult = await sdk.sendEmail(email, "Property Space Declined", message);
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

  useEffect(() => {
    // make sure this effect will only be called once
    if (properties.length > 0 && spaces.length > 0 && !selectedProperty.name) {
      (async function () {
        try {
          const result = await sdk.callRawAPI(
            "/v2/api/custom/ergo/property-spaces/PAGINATE",
            {
              where: [`ergo_property_spaces.id = ${params?.id}`],
              page: 1,
              limit: 1,
            },
            "POST",
          );
          if (!result.error) {
            const data = result.list[0] || {};
            console.log("properties", properties)
            setSelectedProperty(properties.find((prop) => prop.name == data.property_name) || { name: "" });
            setValue("space_id", data.space_id);
            setValue("max_capacity", data.max_capacity);
            setValue("description", data.description);
            setValue("rate", data.rate);
            setValue("visibility", data.availability);
            setValue("space_status", data.space_status);
            setInitialSpaceStatus(data.space_status);
            setValue("reason", data.reason);
            setValue("tax", data?.tax);
            setValue("additional_guest_rate", data.additional_guest_rate);
            setValue("size", data.size);
            setId(data.id);
          }
        } catch (error) {
          console.log("error", error);
          tokenExpireError(dispatch, error.message);
        }
      })();
    }
  }, [properties.length, spaces.length]);

  const onSubmit = async (data) => {
    // validate property and space
    console.log("data", data)
    if (!selectedProperty?.id) {
      setError("property_id", {
        type: "manual",
        message: "Please select a valid property",
      });
      return;
    }
    console.log(data.size)
    data.property_id = selectedProperty.id;

    if (initialSpaceStatus != 2 && data.space_status == 2) {
      // send email to customer
      sendEmailToHost(selectedProperty, data.reason);
    }

    try {
      sdk.setTable("property_spaces");
      const result = await sdk.callRestAPI(
        {
          id: id,
          property_id: data.property_id,
          space_id: data.space_id,
          max_capacity: data.max_capacity,
          description: data.description,
          rate: data.rate,
          tax: data?.tax,
          additional_guest_rate: Number(data.additional_guest_rate) || 0,
          availability: data.visibility,
          space_status: data.space_status,
          size: Number(data.size) || null,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
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
      setError("property_id", {
        type: "manual",
        message: error.message,
      });
    }
  };

  const onError = (err) => {
    console.log("erroring", err);
    if (!selectedProperty?.id) {
      setError("property_id", {
        type: "manual",
        message: "Please select a valid property",
      });
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces",
      },
    });
    (async function () {
      await getPropertyData(1, 10000, { name: null });
      await getSpacesData();
    })();
  }, []);

  return (
    <EditAdminPageLayout
      title="Property Space"
      backTo="property_spaces"
      showDelete={false}
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

          <SmartSearch
            selectedData={selectedProperty}
            setSelectedData={setSelectedProperty}
            data={properties}
            getData={getPropertyData}
            field="name"
            errorField="property_id"
            setError={setError}
          />

          <p className="text-xs italic text-red-500">{errors.property_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="space_id"
          >
            Space
          </label>
          <select
            className={`focus:shadow-outline w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none ${errors.space_id?.message ? "border-red-500" : ""}`}
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
          <p className="text-xs italic text-red-500">{errors.space_id?.message}</p>
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
          <p className="text-xs italic text-red-500">{errors.max_capacity?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            placeholder="Description"
            {...register("description")}
            className={`focus:shadow-outline  mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.description?.message ? "border-red-500" : ""}`}
            rows={15}
          ></textarea>
          <p className="text-xs italic text-red-500">{errors.description?.message}</p>
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
          <p className="text-xs italic text-red-500">{errors.rate?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="additional_guest_price"
          >
            Additional guests price ( Hourly )
          </label>
          <input
            placeholder="Rate for additional guests"
            {...register("additional_guest_rate")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.additional_guest_price?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.additional_guest_price?.message}</p>
        </div>

        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="visibility"
          >
            Visibility
          </label>

          <select
            name="visibility"
            {...register("visibility")}
            className="focus:shadow-outline w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
          >
            <option value={0}>HIDDEN</option>
            <option value={1}>VISIBLE</option>
          </select>
          <p className="text-xs italic text-red-500">{errors.visibility?.message}</p>
        </div>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="space_status"
          >
            Status
          </label>

          <select
            name="space_status"
            {...register("space_status")}
            className="focus:shadow-outline w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
          >
            <option value={0}>UNDER REVIEW</option>
            <option value={1}>APPROVED</option>
            <option value={2}>DECLINED</option>
          </select>
          <p className="text-xs italic text-red-500">{errors.space_status?.message}</p>
        </div>
        {selectedSpaceStatus == 2 && (
          <div className="mb-4 ">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="reason"
            >
              Decline Reason
            </label>
            <textarea
              placeholder="Reason"
              {...register("reason")}
              className={`focus:shadow-outline  mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.reason?.message ? "border-red-500" : ""}`}
              rows={15}
            ></textarea>
            <p className="text-xs italic text-red-500">{errors.reason?.message}</p>
          </div>
        )}

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
    </EditAdminPageLayout>
  );
};

export default EditAdminPropertySpacesPage;
