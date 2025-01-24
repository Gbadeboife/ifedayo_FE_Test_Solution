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

const EditAdminSpacesPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      category: yup.string().required(),
      has_sizes: yup.string(),
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
        sdk.setTable("spaces");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        if (!result.error) {
          setValue("category", result.model.category);
          setValue("has_sizes", result.model.has_sizes);
          setId(result.model.id);
        }
      } catch (error) {
        console.log("error", error);
        tokenExpireError(dispatch, error.message);
        showToast(globalDispatch, error.message, 4000, "ERROR");
      }
    })();
  }, []);

  const onSubmit = async (data) => {
    try {
      var image = undefined;
      var icon = undefined;
      if (data.image.length > 0 && data.image[0]) {
        const formData = new FormData();
        formData.append("file", data.image[0]);
        const upload = await sdk.uploadImage(formData);
        image = upload.url;
      }
      if (data.icon.length > 0 && data.icon[0]) {
        const formData = new FormData();
        formData.append("file", data.icon[0]);
        const upload = await sdk.uploadImage(formData);
        icon = upload.url;
      }
      sdk.setTable("spaces");
      const result = await sdk.callRestAPI(
        {
          id: id,
          category: data.category,
          image,
          icon,
          has_sizes: data.has_sizes,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/spaces");
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
      setError("category", {
        type: "manual",
        message: error.message,
      });
    }
  };
  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "spaces",
      },
    });
  }, []);

  return (
    <EditAdminPageLayout
      title="Space"
      backTo="spaces"
      showDelete={false}
    >
      <form
        className=" w-full max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="category"
          >
            Category
          </label>
          <input
            id="category"
            type="text"
            {...register("category")}
            className={`"   w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none${errors.category?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs italic text-red-500">{errors.category?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="image"
          >
            Banner Image
          </label>
          <input
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-700 focus:outline-none"
            type="file"
            accept="image/png, image/jpeg"
            {...register("image")}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.image?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="image"
          >
            Icon
          </label>
          <input
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-700 focus:outline-none"
            type="file"
            accept="image/png, image/jpeg, image/svg"
            {...register("icon")}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.icon?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="has_sizes"
          >
            Has Sizes
          </label>
          <select
            id="has_sizes"
            type="text"
            {...register("has_sizes")}
            className={`w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none${errors.has_sizes?.message ? "border-red-500" : ""}`}
          >
            <option value={0}>NO</option>
            <option value={1}>YES</option>
          </select>

          <p className="text-xs italic text-red-500">{errors.has_sizes?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/spaces")}
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

export default EditAdminSpacesPage;
