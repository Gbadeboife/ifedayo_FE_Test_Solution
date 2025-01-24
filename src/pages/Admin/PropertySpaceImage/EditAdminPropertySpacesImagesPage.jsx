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

const EditAdminPropertySpacesImagesPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      property_id: yup.number().required().positive().integer(),
      property_spaces_id: yup.number().required().positive().integer(),
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
        sdk.setTable("property_spaces_images");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        if (!result.error) {
          setValue("property_id", result.model.property_id);
          setValue("property_spaces_id", result.model.property_spaces_id);
          setValue("photo_id", result.model.photo_id);
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
      const result = await sdk.callRestAPI(
        {
          id: id,
          property_id: data.property_id,
          property_spaces_id: data.property_spaces_id,
          photo_id: data.photo_id,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/property_spaces_images");
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
  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces_images",
      },
    });
  }, []);

  return (
    <EditAdminPageLayout
      title="Property Space Image"
      backTo="property_spaces_images"
      showDelete={false}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_id"
          >
            Property ID
          </label>
          <input
            placeholder="Property ID"
            {...register("property_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.property_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.property_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_spaces_id"
          >
            Property Spaces ID
          </label>
          <input
            placeholder="Property spaces ID"
            {...register("property_spaces_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.property_spaces_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.property_spaces_id?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="photo_id"
          >
            Photo ID
          </label>
          <input
            placeholder="Photo ID"
            {...register("photo_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.photo_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.photo_id?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/property_spaces_images")}
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

export default EditAdminPropertySpacesImagesPage;
