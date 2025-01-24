import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";

const AddAdminPayoutPage = () => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const schema = yup.object({
    host_id: yup.string(),
    customer_id: yup.string(),
    host_name: yup.string(),
    customer_name: yup.string(),
    total: yup.number().typeError("Total must be a number").required(),
    tax: yup.number().typeError("Tax must be a number").required(),
    commission: yup.number().typeError("Commission must be a number").required(),
    booking_id: yup.number().typeError("Booking id must be a number").required().positive().integer(),
    status: yup.number().required(),
  });

  const { dispatch } = React.useContext(AuthContext);
  let sdk = new MkdSDK();

  const navigate = useNavigate();
  const {
    clearErrors,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const selectStatus = [
    { key: 0, value: "Pending" },
    { key: 1, value: "Initiated" },
    { key: 2, value: "Paid" },
    { key: 3, value: "Cancelled" },
  ];

  async function getSettings() {
    try {
      sdk.setTable("settings");
      // TODO: figure out a solution here for OR operation
      const result = await sdk.callRestAPI(
        {
          // payload: "key_name = 'tax' OR key_name = 'commission'",
          page: 1,
          limit: 2,
        },
        "PAGINATE",
      );
      const { list } = result;
      setValue("tax", list.find((setting) => setting.key_name === "tax").key_value);
      setValue("commission", list.find((setting) => setting.key_name === "commission").key_value);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function checkBookingID(id) {
    if (!id) return;
    try {
      let sdk = new MkdSDK();
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/booking/details",
        {
          where: [`ergo_booking.id=${id}`],
        },
        "POST",
      );

      if (result.error || !result.list || !result.list.id) throw new Error();
      clearErrors("booking_id");
      setValue("host_name", result.list.host_first_name + " " + result.list.host_last_name);
      setValue("customer_name", result.list.customer_first_name + " " + result.list.customer_last_name);
      setValue("host_id", result.list.host_id);
      setValue("customer_id", result.list.customer_id);

      console.log("booking", result.list);
    } catch (error) {
      console.log("ERROR", error);
      setError("booking_id", {
        type: "manual",
        message: "Booking with this ID does not exist",
      });
    }
  }

  const onSubmit = async (data) => {
    console.log("submitting,", data);
    try {
      console.log(data);
      sdk.setTable("payout");
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/payout/POST",
        {
          host_id: Number(data.host_id),
          customer_id: Number(data.customer_id),
          total: data.total,
          tax: data.tax,
          commission: data.commission,
          booking_id: data.booking_id,
          status: data.status,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
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
      tokenExpireError(dispatch, error.message);
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "payout",
      },
    });
    getSettings();
  }, []);

  return (
    <AddAdminPageLayout
      title={"Payout"}
      backTo={"payout"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="booking_id"
          >
            Booking ID
          </label>
          <input
            placeholder="Booking ID"
            {...register("booking_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.booking_id?.message ? "border-red-500" : ""}`}
            onChange={(e) => checkBookingID(e.target.value)}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.booking_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="host"
          >
            Host
          </label>
          <input
            placeholder="Host"
            {...register("host_name")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.host_name?.message ? "border-red-500" : ""}`}
            readOnly
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.host_name?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="customer_id"
          >
            Customer
          </label>
          <input
            placeholder="Customer"
            {...register("customer_name")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.customer_name?.message ? "border-red-500" : ""}`}
            readOnly
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.customer_name?.message}</p>
        </div>

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
              placeholder="Total"
              {...register("total")}
              className={`"shadow   border rounded rounded-l-none w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.total?.message ? "border-red-500" : ""
              }`}
            />
          </div>
          <p className="text-red-500 text-xs italic normal-case">{errors.total?.message}</p>
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
              placeholder="Tax"
              {...register("tax")}
              className={`"shadow   border rounded rounded-l-none w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.tax?.message ? "border-red-500" : ""}`}
              readOnly
            />
          </div>

          <p className="text-red-500 text-xs italic normal-case">{errors.tax?.message}</p>
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
              placeholder="Commission"
              {...register("commission")}
              className={`"shadow   border rounded rounded-l-none w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.commission?.message ? "border-red-500" : ""
              }`}
              readOnly
            />
          </div>
          <p className="text-red-500 text-xs italic normal-case">{errors.commission?.message}</p>
        </div>

        <div className="mb-5">
          <label
            htmlFor="status"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Status
          </label>
          <select
            name="Status"
            id="status"
            className="   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
            {...register("status")}
            defaultValue={0}
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
          <p className="text-red-500 text-xs italic normal-case">{errors.status?.message}</p>
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
    </AddAdminPageLayout>
  );
};

export default AddAdminPayoutPage;
