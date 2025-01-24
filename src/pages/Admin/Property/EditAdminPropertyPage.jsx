import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import CustomComboBoxV2 from "@/components/CustomComboBoxV2";

let sdk = new MkdSDK();

const EditAdminPropertyPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      address_line_1: yup.string().required("Address line one is required"),
      address_line_2: yup.string("Address line 2 is required"),
      city: yup.string().required("City is required"),
      country: yup.string().required("Country is required"),
      zip: yup.string().required("Zip is required"),
      host_id: yup.number(),
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
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const params = useParams();

  async function fetchProperty() {
    try {
      sdk.setTable("property");
      const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
      if (!result.error) {
        setValue("address_line_1", result.model.address_line_1);
        setValue("address_line_2", result.model.address_line_2);
        setValue("city", result.model.city);
        setValue("country", result.model.country);
        setValue("zip", result.model.zip);
        setValue("name", result.model.name);
        setValue("host_id", result.model.host_id);
        setId(result.model.id);
      }
    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  }

  async function fetchHostFiltered(emailFilter, setter, initialUserId) {
    try {
      var list = [];
      if (+initialUserId) {
        const initialUserResult = await sdk.callRawAPI(
          "/v2/api/custom/ergo/user/PAGINATE",
          { page: 1, limit: 1, where: [`${initialUserId ? `ergo_user.id = ${+initialUserId}` : ""} AND ergo_user.role != 'customer'`] },
          "POST",
        );
        if (Array.isArray(initialUserResult.list)) {
          list = initialUserResult.list;
        }
      }
      if (emailFilter) {
        const result = await sdk.callRawAPI("/v2/api/custom/ergo/user/PAGINATE", { page: 1, limit: 10, where: [`ergo_user.email LIKE '%${emailFilter}%' AND ergo_user.role != 'customer'`] }, "POST");
        if (Array.isArray(result.list)) {
          list = [...list, ...result.list];
        }
      }
      setter(list);
    } catch (err) {
      console.log("err", err);
    }
  }

  const onSubmit = async (data) => {
    console.log("submitting", data);
    try {
      const result = await sdk.callRestAPI(
        {
          id: id,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2,
          city: data.city,
          country: data.country,
          zip: data.zip,
          host_id: data.host_id,
          name: data.name,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/property");
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
      setError("address_line_1", {
        type: "manual",
        message: error.message,
      });
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property",
      },
    });
    fetchProperty();
  }, []);

  return (
    <form
      className=" mt-10 w-full max-w-lg"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-5 flex justify-between">
        <p className="text-base font-bold">Edit Property</p>
        <button onClick={() => navigate(`/admin/view-property/${params?.id}`)}>Cancel</button>
      </div>
      <div className="mb-4 flex justify-between ">
        <p>ID</p>
        <p className="font-bold">{id}</p>
      </div>
      <div className="mb-4 ">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="name"
        >
          Property Name
        </label>
        <input
          placeholder="Property Name"
          {...register("name")}
          className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.name?.message ? "border-red-500" : ""}`}
        />
        <p className="text-xs normal-case italic text-red-500">{errors.name?.message}</p>
      </div>
      <div className="mb-4 ">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="host_id"
        >
          Host Email
        </label>
        <CustomComboBoxV2
          control={control}
          name="host_id"
          setValue={(val) => setValue("host_id", val)}
          valueField={"id"}
          labelField={"email"}
          getItems={fetchHostFiltered}
          className="relative flex h-[40px] items-center rounded border px-3"
          placeholder="Host email"
        />
        <p className="text-xs normal-case italic text-red-500">{errors.host_id?.message}</p>
      </div>
      <div className="mb-4 ">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="address_line_1"
        >
          Address Line 1
        </label>
        <input
          placeholder="Address Line 1"
          {...register("address_line_1")}
          className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.address_line_1?.message ? "border-red-500" : ""}`}
        />
        <p className="text-xs normal-case italic text-red-500">{errors.address_line_1?.message}</p>
      </div>

      <div className="mb-4 ">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="address_line_2"
        >
          Address Line 2
        </label>
        <input
          placeholder="Address Line 2"
          {...register("address_line_2")}
          className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.address_line_2?.message ? "border-red-500" : ""}`}
        />
        <p className="text-xs normal-case italic text-red-500">{errors.address_line_2?.message}</p>
      </div>

      <div className="mb-4 ">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="city"
        >
          City
        </label>
        <input
          placeholder="City"
          {...register("city")}
          className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.city?.message ? "border-red-500" : ""}`}
        />
        <p className="text-xs normal-case italic text-red-500">{errors.city?.message}</p>
      </div>

      <div className="mb-4 ">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="country"
        >
          Country
        </label>
        <input
          placeholder="Country"
          {...register("country")}
          className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.country?.message ? "border-red-500" : ""}`}
        />
        <p className="text-xs normal-case italic text-red-500">{errors.country?.message}</p>
      </div>

      <div className="mb-4 ">
        <label
          className="mb-2 block text-sm font-bold text-gray-700"
          htmlFor="zip"
        >
          Zip Code
        </label>
        <input
          placeholder="Zip Code"
          {...register("zip")}
          className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.zip?.message ? "border-red-500" : ""}`}
        />
        <p className="text-xs normal-case italic text-red-500">{errors.zip?.message}</p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => navigate("/admin/property")}
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
  );
};

export default EditAdminPropertyPage;
