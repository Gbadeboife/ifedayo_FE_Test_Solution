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

const AddAdminSettingsPage = () => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const schema = yup
    .object({
      key_name: yup.string().required(),
      key_value: yup.string().required(),
    })
    .required();

  const { dispatch } = React.useContext(AuthContext);

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
    let sdk = new MkdSDK();

    try {
      sdk.setTable("settings");

      const result = await sdk.callRestAPI(
        {
          key_name: data.key_name.toLowerCase(),
          key_value: data.key_value,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/settings");
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
      setError("key_name", {
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
        path: "settings",
      },
    });
  }, []);

  return (
    <AddAdminPageLayout
      title={"Settings"}
      backTo={"settings"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="key_name"
          >
            Key Name
          </label>
          <input
            placeholder="Key name"
            {...register("key_name")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.key_name?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.key_name?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="key_value"
          >
            Key Value
          </label>
          <input
            placeholder="key value"
            {...register("key_value")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.key_value?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.key_value?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/settings")}
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

export default AddAdminSettingsPage;
