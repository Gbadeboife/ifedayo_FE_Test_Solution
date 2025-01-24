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

const EditAdminSettingsPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      key_value: yup.string().required(),
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
        sdk.setTable("settings");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        if (!result.error) {
          setValue("key_name", result.model.key_name);
          setValue("key_value", result.model.key_value);
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
          key_value: data.key_value,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
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
    <EditAdminPageLayout
      title="Setting"
      backTo="settings"
      table1="settings"
      deleteMessage="Are you sure you want to delete this setting?"
      id={id}
      showDelete={false}
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
            KeyName
          </label>
          <input
            placeholder="Key Name"
            disabled
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
            KeyValue
          </label>
          <input
            placeholder="Key Value"
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
    </EditAdminPageLayout>
  );
};

export default EditAdminSettingsPage;
