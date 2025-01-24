import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import EditAdminPageLayout from "@/layouts/EditAdminPageLayout";

let sdk = new MkdSDK();

const EditAdminPayoutPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      // host_id: yup.number().required().positive().integer(),
      // customer_id: yup.number().required().positive().integer(),
      // property_id: yup.number().required().positive().integer(),
      total: yup.number().required().positive().typeError("total must be a number"),
      tax: yup.number().required().typeError("tax must be a number"),
      commission: yup.number().required().typeError("commission must be a number"),
      booking_id: yup.number().required().positive().integer().typeError("booking id must be a number"),
      status: yup.string(),
    })
    .required();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const [id, setId] = useState(0);
  const [customerId, setCustomerId] = useState(0);
  const [hostId, setHostId] = useState(0);
  const [propertyId, setPropertyId] = useState(0);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const params = useParams();

  const selectStatus = [
    { key: "0", value: "Pending" },
    { key: "1", value: "initiated" },
    { key: "2", value: "Paid" },
    { key: "3", value: "Cancelled" },
  ];

  useEffect(function () {
    (async function () {
      try {
        sdk.setTable("payout");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        if (!result.error) {
          setHostId(result.model.host_id);
          setCustomerId(result.model.customer_id);
          setPropertyId(result.model.property_id);
          setValue("total", result.model.total);
          setValue("tax", result.model.tax ?? 0);
          setValue("commission", result.model.commission ?? 0);
          setValue("booking_id", result.model.booking_id);
          setValue("status", result.model.status);
          setId(result.model.id);
        }
      } catch (error) {
        console.log("error", error);
        tokenExpireError(dispatch, error.message);
      }
    })();
  }, []);

  const onSubmit = async (data) => {
    try {
      let editedPayout = {
        id: id,
        host_id: hostId,
        customer_id: customerId,
        property_id: propertyId,
        total: data.total,
        tax: data.tax,
        commission: data.commission,
        booking_id: data.booking_id,
        status: data.status,
      };

      if (editedPayout.status == "1") {
        let todayDate = new Date();
        editedPayout.initiated_at = todayDate.toISOString();
      }
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/payout/PUT", { ...editedPayout }, "POST");

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/payout");
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
      setError("host_id", {
        type: "manual",
        message: error.message,
      });
    }
  };
  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "payout",
      },
    });
  }, []);

  return (
    <EditAdminPageLayout
      title="Payout"
      backTo="payout"
      table1="payout"
      deleteMessage="Are you sure you want to delete this payout?"
      id={id}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="host_id"
          >
            HostId
          </label>
          <input
            placeholder="host_id"
            {...register("host_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.host_id?.message ? "border-red-500" : ""
              }`}
          />
          <p className="text-red-500 text-xs italic">
            {errors.host_id?.message}
          </p>
        </div>


        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="customer_id"
          >
            CustomerId
          </label>
          <input
            placeholder="customer_id"
            {...register("customer_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.customer_id?.message ? "border-red-500" : ""
              }`}
          />
          <p className="text-red-500 text-xs italic">
            {errors.customer_id?.message}
          </p>
        </div>


        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_id"
          >
            PropertyId
          </label>
          <input
            placeholder="property_id"
            {...register("property_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.property_id?.message ? "border-red-500" : ""
              }`}
          />
          <p className="text-red-500 text-xs italic">
            {errors.property_id?.message}
          </p>
        </div>
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="booking_id"
          >
            BookingId
          </label>
          <input
            placeholder="booking_id"
            {...register("booking_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.booking_id?.message ? "border-red-500" : ""
              }`}
          />
          <p className="text-red-500 text-xs italic">
            {errors.booking_id?.message}
          </p>
        </div> */}
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="total"
          >
            Total
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 text-sm bg-gray-100 rounded-l-md border border-r-0 border-gray-300">&#36;</span>
            <input
              disabled
              placeholder="Total"
              {...register("total")}
              className={`"shadow   border rounded rounded-l-none w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.total?.message ? "border-red-500" : ""
              }`}
            />
          </div>
          <p className="text-red-500 text-xs italic">{errors.total?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="tax"
          >
            Tax
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 text-sm bg-gray-100 rounded-l-md border border-r-0 border-gray-300">&#36;</span>
            <input
              disabled
              placeholder="Tax"
              {...register("tax")}
              className={`"shadow   border rounded rounded-l-none w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.tax?.message ? "border-red-500" : ""}`}
            />
          </div>

          <p className="text-red-500 text-xs italic">{errors.tax?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="commission"
          >
            Commission
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 text-sm bg-gray-100 rounded-l-md border border-r-0 border-gray-300">&#36;</span>
            <input
              disabled
              placeholder="Commission"
              {...register("commission")}
              className={`"shadow   border rounded rounded-l-none w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.commission?.message ? "border-red-500" : ""
              }`}
            />
          </div>
          <p className="text-red-500 text-xs italic">{errors.commission?.message}</p>
        </div>

        <div className="mb-5">
          <label
            htmlFor="status"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Status
          </label>
          <select
            name="status"
            id="status"
            className="   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
            {...register("status")}
          >
            {selectStatus.map((option) => (
              <option
                name="status"
                value={option.key}
                key={option.key}
              >
                {option.value}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/payout")}
            className="!bg-gradient-to-r flex-1 text-[#667085] font-semibold border border-[#667085] px-6 py-2 text-sm outline-none focus:outline-none mb-1 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="!bg-gradient-to-r flex-1 from-[#33D4B7] to-[#0D9895] font-semibold text-white  px-6 py-2 text-sm outline-none focus:outline-none ml-5 mb-1 rounded"
          >
            Save
          </button>
        </div>
      </form>
    </EditAdminPageLayout>
  );
};

export default EditAdminPayoutPage;
