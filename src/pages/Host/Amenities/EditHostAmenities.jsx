import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import EditAdminPageLayout from "@/layouts/EditAdminPageLayout";
import { LoadingButton } from "@/components/frontend";

let sdk = new MkdSDK();

const EditHostAmenitiesPage = () => {
  const [spaceCategories, setSpaceCategories] = React.useState([]);
  const { dispatch } = React.useContext(AuthContext);
  const [loading, setLoading] = React.useState();

  const schema = yup
    .object({
      name: yup.string().required("Name is required"),
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
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const params = useParams();

  useEffect(function () {
    (async function () {
      try {
        sdk.setTable("amenity");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        if (!result.error) {
          setValue("name", result.model.name);
          setId(result.model.id);
        }
      } catch (error) {
        console.log("error", error);
        tokenExpireError(dispatch, error.message);
      }
    })();
  }, []);

  async function fetchSpaceCategories() {
    try {
      sdk.setTable("spaces");
      const result = await sdk.callRestAPI({}, "GETALL");
      if (Array.isArray(result.list)) {
        setSpaceCategories(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)

    sdk.setTable("amenity");
    try {
      const result = await sdk.callRestAPI(
        {
          id: id,
          name: data.name,
          cost: data.cost,
          space_id: data.space_id,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
    setLoading(false)
        navigate("/account/my-amenities");
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
    setLoading(false)
      console.log("Error", error);
      setError("name", {
        type: "manual",
        message: error.message,
      });
    }
  };
  React.useEffect(() => {
    fetchSpaceCategories();
  }, []);

  return (
    <div className="mt-10">
      <form
        className=" w-full max-w-lg mt-10"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="name"
          >
            Name
          </label>
          <input
            placeholder="Name"
            {...register("name")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.name?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.name?.message}</p>
        </div>


        <div className="flex justify-between">
          <button
          disabled={loading}
            onClick={() => navigate("/account/my-amenities")}
            className="mb-1 flex-1 rounded border border-[#667085] !bg-gradient-to-r px-6 py-2 text-sm font-semibold text-[#667085] outline-none focus:outline-none"
          >
            Cancel
          </button>

          <LoadingButton
          loading={loading}
          type="submit"
          className={`ml-5 mb-1 flex-1 rounded !bg-gradient-to-r from-[#33D4B7]  to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"}`}>
            Save
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};

export default EditHostAmenitiesPage;
