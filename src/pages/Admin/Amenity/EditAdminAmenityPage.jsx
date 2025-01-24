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

const EditAdminAmenityPage = () => {
  const [spaceCategories, setSpaceCategories] = React.useState([]);
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      name: yup.string().required("Category is required"),
      space_id: yup.number().nullable(),
    })
    .required();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const [name, setName] = useState("");
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
          setValue("space_id", result.model.space_id);
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
    try {
      sdk.setTable("amenity");
      const result = await sdk.callRestAPI(
        {
          id: id,
          name: data.name,
          space_id: data.space_id,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/amenity");
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
      setError("name", {
        type: "manual",
        message: error.message,
      });
    }
  };
  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "amenity",
      },
    });
    fetchSpaceCategories();
  }, []);

  return (
    <EditAdminPageLayout
      title="Amenity"
      backTo="amenity"
      table1="amenity"
      showDelete={false}
    >
      <form
        className=" w-full max-w-lg"
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
            className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.name?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.name?.message}</p>
        </div>

        <div className="mb-4">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="space_id"
          >
            Space Category
          </label>
          <select
            {...register("space_id")}
            className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none ${
              errors.space_id?.message ? "border-red-500" : ""
            }`}
          >
            {spaceCategories.map((ctg) => (
              <option
                key={ctg.id}
                value={ctg.id}
              >
                {ctg.category}
              </option>
            ))}
          </select>
          <p className="text-xs italic text-red-500">{errors.space_id?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/amenity")}
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

export default EditAdminAmenityPage;
