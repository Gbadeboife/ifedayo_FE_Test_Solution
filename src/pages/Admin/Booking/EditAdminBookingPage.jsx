import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import EditAdminPageLayout from "@/layouts/EditAdminPageLayout";
import { addHours } from "@/utils/utils";
import moment from "moment";
import SmartSearch from "@/components/SmartSearch";

let sdk = new MkdSDK();

const EditAdminBookingPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup.object({
    property_space_id: yup.number(),
    customer_id: yup.number(),
    host_id: yup.number(),
    status: yup.number().required(),
    payment_status: yup.number().required(),
    booked_unit: yup.number().required().positive().integer(),
    payment_method: yup.string(),
    booking_start_time: yup.string(),
    duration: yup.number().required().positive().integer(),
  });

  const [selectedSpace, setSelectedSpace] = React.useState({});
  const [propertySpaces, setPropertySpaces] = React.useState([]);

  const [selectedCustomer, setSelectedCustomer] = React.useState({});
  const [customers, setCustomers] = React.useState([]);
  const [booking, setBooking] = React.useState({});

  const [selectedHost, setSelectedHost] = React.useState({});
  const [hosts, setHosts] = React.useState([]);
  const [initialStatus, setInitialStatus] = React.useState(0);
  const [settings, setSettings] = React.useState([]);

  async function getHostData(pageNum, limitNum, data) {
    try {
      sdk.setTable("user");
      const payload = { email: data.email || undefined, role: "host" };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limitNum,
        },
        "PAGINATE",
      );
      const { list } = result;
      setHosts(list || []);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }
  async function getCustomerData(pageNum, limitNum, data) {
    try {
      sdk.setTable("user");
      const payload = { email: data.email || undefined };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limitNum,
        },
        "PAGINATE",
      );
      const { list } = result;
      setCustomers(list || []);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function getSettings() {
    try {
      sdk.setTable("settings");

      const result = await sdk.callRestAPI(
        {
          // payload: "key_name = 'tax' OR key_name = 'commission'",
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

  async function getPropertySpacesData(pageNum, limit, data) {
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-spaces/PAGINATE",
        {
          where: [data?.property_name ? `ergo_property.name LIKE '%${data.property_name}%' OR ergo_spaces.category LIKE '%${data.property_name}%'` : 1],
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

  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const [id, setId] = useState(0);
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

  const paymentMethod = [
    {
      key: "credit_card",
      value: "Credit Card",
    },
  ];

  useEffect(() => {
    if (customers.length > 0 && hosts.length > 0 && propertySpaces.length > 0 && !selectedCustomer?.email && !selectedHost?.email && !selectedSpace.category) {
      (async function () {
        try {
          sdk.setTable("booking");
          const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
          if (!result.error) {
            setSelectedSpace(propertySpaces.find((sp) => sp.id == result.model.property_space_id) || {});
            setSelectedCustomer(customers.find((c) => c.id == result.model.customer_id) || {});
            setSelectedHost(hosts.find((h) => h.id == result.model.host_id) || {});
            setValue("status", result.model.status);
            setInitialStatus(result.model.status);
            setValue("payment_status", result.model.payment_status);
            setValue("payment_method", result.model.payment_method);
            setValue("booking_start_time", moment(result.model.booking_start_time).format("yyyy-MM-DDTHH:mm"));
            setValue("duration", result.model.duration / 3600);
            setValue("booked_unit", result.model.booked_unit);
            setBooking(result.model);

            setId(result.model.id);
          }
        } catch (error) {
          console.log("error", error);
          tokenExpireError(dispatch, error.message);
        }
      })();
    }
  }, [customers.length, hosts.length, propertySpaces.length]);

  const onSubmit = async (data) => {
    if (!selectedHost?.id) {
      setError("host_id", {
        type: "manual",
        message: "Please select a valid host",
      });
      return;
    }
    if (!selectedCustomer?.id) {
      setError("customer_id", {
        type: "manual",
        message: "Please select a valid customer",
      });
      return;
    }
    if (!selectedSpace?.id) {
      setError("property_space_id", {
        type: "manual",
        message: "Please select a valid space",
      });
      return;
    }
    data.host_id = selectedHost.id;
    data.customer_id = selectedCustomer.id;
    data.property_space_id = selectedSpace.id;
    let bookingStartTime = new Date(data.booking_start_time);
    let bookingEndTime = addHours(data.duration, bookingStartTime);
    data.duration = data.duration * 60 * 60;

    const dataPayload = {
      id: Number(params?.id),
      booked_unit: 1,
      status: data.status === booking.status ? null : data.status,
      payment_status: data.payment_status === booking.payment_status ? null : data.payment_status,
      booking_start_time: new Date(data.booking_start_time).getTime() === new Date(booking.booking_start_time).getTime() ? null : bookingStartTime.toISOString(),
      booking_end_time: new Date(data.booking_start_time).getTime() === new Date(booking.booking_start_time).getTime() ? null : bookingEndTime.toISOString(),
      duration: data.duration,
    }

    const removeNullValues = () => {
      const cleanedObject = {};
      for (const key in dataPayload) {
        if (dataPayload[key] !== null) {
          cleanedObject[key] = dataPayload[key];
        }
      }
      return cleanedObject;
    };

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/booking/PUT",
        removeNullValues(),
        "POST",
      );
      // create payout is status = 3
      if (data.status == 3 && initialStatus != 3) {
        sdk.setTable("booking");
        const newBookingResult = await sdk.callRawAPI(
          "/v2/api/custom/ergo/booking/details",
          {
            where: [`ergo_booking.id=${result.message}`],
          },
          "POST",
        );
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
        showToast(globalDispatch, "Updated");
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
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
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
      await getCustomerData(1, 200, { email: "" });
      await getHostData(1, 200, { email: "" });
      await getPropertySpacesData(1, 100, { property_name: "" });
    })();
  }, []);

  return (
    <EditAdminPageLayout
      title="Booking"
      backTo="booking"
      table1="booking"
      deleteMessage="Are you sure you want to delete this booking?"
      id={id}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_id"
          >
            Property
          </label>

          <SmartSearch
            selectedData={selectedSpace}
            setSelectedData={setSelectedSpace}
            data={propertySpaces}
            getData={getPropertySpacesData}
            field="property_name"
            field2="space_category"
            errorField="property_space_id"
            setError={setError}
            type={true}
          />

          <p className="text-red-500 text-xs italic">{errors.property_space_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
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
            type={true}
          />
          <p className="text-red-500 text-xs italic">{errors.customer_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="host_id"
          >
            Host
          </label>
          <SmartSearch
            selectedData={selectedHost}
            setSelectedData={setSelectedHost}
            data={hosts}
            getData={getHostData}
            field="email"
            errorField="host_id"
            setError={setError}
            type={true}
          />
          <p className="text-red-500 text-xs italic">{errors.host_id?.message}</p>
        </div>

        <div className="mb-4 w-full">
          <label className="block text-gray-700 text-sm font-bold mb-2">Status</label>
          <select
            className="bg-white border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
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
          <p className="text-red-500 text-xs italic"> {errors.status?.message}</p>
        </div>

        <div className="mb-4 w-full">
          <label className="block text-gray-700 text-sm font-bold mb-2">Payment Status</label>
          <select
            className="bg-white border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
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
          <p className="text-red-500 text-xs italic"> {errors.payment_status?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="booking_date"
          >
            Booking Time
          </label>
          <input
            type="datetime-local"
            placeholder="Booking Date"
            {...register("booking_start_time")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.booking_start_time?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.booking_start_time?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="duration"
          >
            Duration
          </label>
          <input
            placeholder="Duration ( hours )"
            {...register("duration")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.duration?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.duration?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/booking")}
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

export default EditAdminBookingPage;
