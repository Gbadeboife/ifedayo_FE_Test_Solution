import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";
import { addHours } from "@/utils/utils";
import SmartSearch from "@/components/SmartSearch";
import { useEffect } from "react";
import TreeSDK from "@/utils/TreeSDK";

const treeSdk = new TreeSDK();
const AddAdminBookingPage = () => {
  let sdk = new MkdSDK();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [settings, setSettings] = React.useState([]);

  const [selectedSpace, setSelectedSpace] = React.useState();
  const [propertySpaces, setPropertySpaces] = React.useState([]);

  const [selectedCustomer, setSelectedCustomer] = React.useState({});
  const [customers, setCustomers] = React.useState([]);

  const [selectedHost, setSelectedHost] = React.useState({});

  const schema = yup
    .object({
      status: yup.number().required().typeError("This field is required"),
      payment_status: yup.number().required().typeError("This field is required"),
      // booked_unit: yup.number().required().positive().integer().typeError("Booked unit must be a number"),
      // payment_method: yup.string(),
      booking_date: yup
        .string()
        .test("is-not-in-past", "Not a valid booking date", (val) => {
          const date = new Date(val);
          return date.setDate(date.getDate() + 1) > new Date();
        })
        .required("Booking date is required"),
      booking_time: yup.string().required("Booking time is required"),
      duration: yup.number().required().positive().integer().typeError("Duration must be a number"),
      host_id: yup.string().required("Host is required"),
    })
    .required();

  const { dispatch } = React.useContext(AuthContext);

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, isValidating },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const selectStatus = [
    { key: "0", value: "Pending" },
    { key: "1", value: "Upcoming" },
    { key: "2", value: "Ongoing" },
    { key: "3", value: "Complete" },
    { key: "4", value: "Declined" },
    { key: "5", value: "Cancelled" },
  ];

  const selectPaymentStatus = [
    { key: "0", value: "Pending" },
    { key: "1", value: "Paid" },
    { key: "2", value: "Declined" },
    { key: "3", value: "Cancelled" },
  ];

  async function getSettings() {
    try {
      sdk.setTable("settings");
      // TODO: figure out a solution here for OR operation
      const result = await sdk.callRestAPI(
        {
          page: 1,
          limit: 2,
        },
        "PAGINATE",
      );
      const { list } = result;
      setSettings(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function getCustomerData(pageNum, limitNum, data) {
    try {
      let filter = ["deleted_at,is"];
      if (data.email) {
        filter.push(`email,cs,${data.email}`);
      }
      const result = await treeSdk.getList("user", { join: [], filter });
      const { list } = result;
      setCustomers(list);
    } catch (error) {
      tokenExpireError(dispatch, error.message);
    }
  }

  async function getHostData(pageNum, limitNum, data) {
    try {
      sdk.setTable("user");
      const payload = { id: data.id || undefined, role: "host" };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limitNum,
        },
        "PAGINATE",
      );
      const { list } = result;
      setSelectedHost(list[0]);
      setValue("host_id", list[0].email);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function getPropertySpaceData(pageNum, limit, data) {
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-spaces/PAGINATE",
        {
          where: [data?.property_name ? `ergo_property.name LIKE '%${data.property_name}%' OR ergo_spaces.category LIKE '%${data.property_name}%'` : 1, "ergo_property_spaces.deleted_at IS NULL"],
          page: pageNum,
          limit: limit,
        },
        "POST",
      );
      const { list } = result;
      setPropertySpaces(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  const onSubmit = async (data) => {
    console.log("submitting", data);
    if (selectedCustomer?.id && selectedHost?.id && selectedSpace?.id) {
      data.customer_id = selectedCustomer.id;
      data.host_id = selectedHost.id;
      data.property_space_id = selectedSpace.id;
      try {
        let bookingStartTime = new Date(`${data.booking_date} ${data.booking_time}`);
        let bookingEndTime = addHours(data.duration, bookingStartTime);
        data.duration = data.duration * 60 * 60;
        const result = await sdk.callRawAPI(
          "/v2/api/custom/ergo/booking/POST",
          {
            property_space_id: data.property_space_id,
            customer_id: data.customer_id,
            host_id: data.host_id,
            booked_unit: 1,
            payment_method: 1,
            status: data.status,
            payment_status: data.payment_status,
            booking_start_time: bookingStartTime.toISOString(),
            booking_end_time: bookingEndTime.toISOString(),
            duration: data.duration,
            tax_rate: settings.find((setting) => setting.key_name === "tax")?.key_value,
            commission_rate: settings.find((setting) => setting.key_name === "commission")?.key_value,
          },
          "POST",
        );
        // create payout is status = 3
        if (data.status == 3) {
          sdk.setTable("booking");
          const newBookingResult = await sdk.callRawAPI(
            "/v2/api/custom/ergo/booking/details",
            {
              where: [`ergo_booking.id=${result.message}`],
            },
            "POST",
          );
          console.log("newBookingResult", newBookingResult);
          const payoutResult = await sdk.callRawAPI(
            "/v2/api/custom/ergo/payout/POST",
            {
              initiated_at: bookingStartTime.toISOString(),
              host_id: data.host_id,
              customer_id: data.customer_id,
              property_space_id: data.property_space_id,
              total: newBookingResult.list.total + newBookingResult.list.addon_cost,
              tax: settings.find((setting) => setting.key_name === "tax").key_value,
              commission: settings.find((setting) => setting.key_name === "commission").key_value,
              booking_id: result.message,
              status: 0,
            },
            "POST",
          );
          console.log("payoutResult", payoutResult);
        }

        if (!result.error) {
          showToast(globalDispatch, "Added");
          navigate("/admin/booking");
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
        showToast(globalDispatch, error.message);
        tokenExpireError(dispatch, error.message);
      }
    } else {
      if (!selectedCustomer) {
        setError("customer_id", {
          type: "manual",
          message: "Please select a customer",
        });
      }
      if (!selectedHost) {
        setError("host_id", {
          type: "manual",
          message: "Please select a host",
        });
      }
      if (!selectedSpace) {
        setError("property_space_id", {
          type: "manual",
          message: "Please select a property space",
        });
      }
    }
  };

  const onError = () => {
    if (!selectedCustomer?.id) {
      setError("customer_id", {
        type: "manual",
        message: "Please select a customer",
      });
    }
    if (!selectedHost?.id) {
      setError("host_id", {
        type: "manual",
        message: "Please select a host",
      });
    }
    if (!selectedSpace?.id) {
      setError("property_space_id", {
        type: "manual",
        message: "Please select a property space",
      });
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "booking",
      },
    });
    (async function () {
      await getSettings();
      await getCustomerData();
      await getPropertySpaceData(1, 10, { property_name: "" });
    })();
  }, []);

  // set host automatically
  useEffect(() => {
    console.log("selectedSpace", selectedSpace);
    if (!selectedSpace?.property_id) return;
    (async function () {
      try {
        const result = await sdk.callRawAPI(
          "/v2/api/custom/ergo/property/PAGINATE",
          {
            where: [selectedSpace ? `${selectedSpace.property_id ? `ergo_property.id = '${selectedSpace.property_id}'` : "1"} ` : 1],
            page: 1,
            limit: 1,
          },
          "POST",
        );
        console.log("result", result.list[0].host_id);
        await getHostData(1, 1, { id: result.list[0].host_id });
      } catch (err) {
        console.log("err", err);
      }
    })();
  }, [selectedSpace]);

  return (
    <AddAdminPageLayout
      title={"Booking"}
      backTo={"booking"}
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
            Property Space
          </label>
          <SmartSearch
            selectedData={selectedSpace}
            setSelectedData={setSelectedSpace}
            data={propertySpaces}
            getData={getPropertySpaceData}
            field="property_name"
            field2="space_category"
            errorField="property_space_id"
            setError={setError}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.property_space_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="customer_id"
          >
            Customer
          </label>
          <SmartSearch
            selectedData={selectedCustomer}
            setSelectedData={setSelectedCustomer}
            data={customers}
            getData={getCustomerData}
            field="email"
            errorField="customer_id"
            setError={setError}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.customer_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="host_id"
          >
            Host
          </label>
          <input
            type="text"
            placeholder="Host"
            readOnly
            {...register("host_id")}
            className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.host_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.host_id?.message}</p>
        </div>

        <div className="mb-4 w-full">
          <label className="mb-2 block text-sm font-bold text-gray-700">Status</label>
          <select
            className=" mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            {...register("status")}
          >
            <option
              selected
              value="none"
              hidden
            >
              Select Option
            </option>
            {selectStatus.map((option) => (
              <option
                name="Status"
                value={option.key}
                key={option.key}
              >
                {option.value}
              </option>
            ))}
          </select>
          <p className="norma-casel text-xs italic text-red-500"> {errors.status?.message}</p>
        </div>

        <div className="mb-4 w-full">
          <label className="mb-2 block text-sm font-bold text-gray-700">Payment Status</label>
          <select
            className=" mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            {...register("payment_status")}
          >
            <option
              selected
              value="none"
              hidden
            >
              Select Option
            </option>
            {selectPaymentStatus.map((option) => (
              <option
                name="payment_status"
                value={option.key}
                key={option.key}
              >
                {option.value}
              </option>
            ))}
          </select>
          <p className="norma-casel text-xs italic text-red-500"> {errors.payment_status?.message}</p>
        </div>
        {/* <div className="mb-4 w-full">
          <label className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
          <select
            className=" border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
            {...register("payment_method")}
          >
            <option
              selected
              value="none"
              hidden
            >
              Select Option
            </option>
            {paymentMethod.map((option) => (
              <option
                name="payment_method"
                value={option.key}
                key={option.key}
              >
                {option.value}
              </option>
            ))}
          </select>
          <p className="text-red-500 text-xs italic norma-casel"> {errors.payment_method?.message}</p>
        </div> */}

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="booking_date"
          >
            Booking Date
          </label>
          <input
            type="date"
            placeholder="Booking Date"
            {...register("booking_date")}
            className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.booking_date?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.booking_date?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="booking_date"
          >
            Booking Time
          </label>
          <input
            type="time"
            placeholder="Booking Time"
            {...register("booking_time")}
            className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.booking_time?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.booking_time?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="duration"
          >
            Duration
          </label>
          <input
            placeholder="Duration ( hours )"
            {...register("duration")}
            className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.duration?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.duration?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/booking")}
            className="mb-1 flex-1 rounded border border-[#667085] !bg-gradient-to-r px-6 py-2 text-sm font-semibold text-[#667085] outline-none focus:outline-none"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting || isValidating}
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

export default AddAdminBookingPage;
