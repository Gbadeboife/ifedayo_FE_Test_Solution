import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";

const AddAdminSpacesPage = () => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const schema = yup
    .object({
      category: yup.string().required(),
      has_sizes: yup.string(),
    })
    .required();

  const { dispatch } = React.useContext(AuthContext);
  const [loading, setLoading] = React.useState(false);

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    if (data.image.length < 1 || !data.image[0]) {
      setError("image", { type: "manual", message: "This field is required" });
      return;
    }
    if (data.icon.length < 1 || !data.icon[0]) {
      setError("icon", { type: "manual", message: "This field is required" });
      return;
    }
    let sdk = new MkdSDK();
    try {
      const formData = new FormData();
      formData.append("file", data.image[0]);
      const upload = await sdk.uploadImage(formData);
      const formIconData = new FormData();
      formIconData.append("file", data.icon[0]);
      const uploadIcon = await sdk.uploadImage(formIconData);
      sdk.setTable("spaces");

      const result = await sdk.callRestAPI(
        {
          category: data.category,
          image: upload.url,
          icon: uploadIcon.url,
          has_sizes: data.has_sizes,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
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
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
    setLoading(false);
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
    <AddAdminPageLayout
      title={"Space"}
      backTo={"spaces"}
    >
      <div className="border-t-0 p-5">
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
              disabled={loading}
              className="ml-5 mb-1 flex-1 rounded !bg-gradient-to-r from-[#33D4B7]  to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </AddAdminPageLayout>
  );
};

export default AddAdminSpacesPage;
