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

const EditAdminBookingAddonsPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      booking_id: yup.number().required().positive().integer(),
      property_add_on_id: yup.number().required().positive().integer(),
    })
    .required();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const [addOns, setAddOns] = React.useState([]);
  const [propertyName, setPropertyName] = React.useState("");

  const [id, setId] = useState(0);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const params = useParams();

  const getAllAddOns = async () => {
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-addons/PAGINATE",
        {
          where: [propertyName ? `${propertyName ? `ergo_property.name = '${propertyName}'` : "1"}` : 1],
          page: 1,
          limit: 1000,
        },
        "POST",
      );
      const { list } = result;
      console.log("addon", list);
      setAddOns(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  };

  const confirmBookingId = async (id) => {
    if (!id) {
      clearErrors("booking_id");
      return;
    }
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
      setPropertyName(result.list.property_name);
    } catch (error) {
      console.log("ERROR", error);
      setError("booking_id", {
        type: "manual",
        message: "Booking with this ID does not exist",
      });
    }
  };

  useEffect(
    function () {
      // this function should only run once
      if (addOns.length > 0 && id == 0) {
        (async function () {
          try {
            sdk.setTable("booking_addons");
            const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
            if (!result.error) {
              setValue("booking_id", result.model.booking_id);
              confirmBookingId(result.model.booking_id);
              setValue("property_add_on_id", result.model.property_add_on_id);
              setId(result.model.id);
            }
          } catch (error) {
            console.log("error", error);
            tokenExpireError(dispatch, error.message);
          }
        })();
      }
    },
    [addOns.length],
  );

  useEffect(() => {
    if (propertyName != "") {
      getAllAddOns();
    }
  }, [propertyName]);

  const onSubmit = async (data) => {
    try {
      const result = await sdk.callRestAPI(
        {
          id: id,
          booking_id: data.booking_id,
          property_add_on_id: data.property_add_on_id,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/booking_addons");
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
      setError("booking_id", {
        type: "manual",
        message: error.message,
      });
    }
  };
  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "booking_addons",
      },
    });
    getAllAddOns();
  }, []);

  return (
    <EditAdminPageLayout
      title="Booking Add on"
      backTo="booking_addons"
      showDelete={false}
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
          />
          <p className="text-red-500 text-xs italic">{errors.booking_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_add_on_id"
          >
            Property Add-On
          </label>
          <select
            className="border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
            {...register("property_add_on_id")}
          >
            <option value="">Select Option</option>
            {addOns.map((option) => (
              <option
                key={option.id}
                value={option.id}
              >
                {option.add_on_name}
              </option>
            ))}
          </select>
          <p className="text-red-500 text-xs italic">{errors.property_add_on_id?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/booking_addons")}
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

export default EditAdminBookingAddonsPage;
