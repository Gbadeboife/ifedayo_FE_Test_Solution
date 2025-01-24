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

const EditAdminHashTagPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      name: yup.string().required("Name is required"),
    })
    .required();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
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
        sdk.setTable("hashtag");
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

  const onSubmit = async (data) => {
    try {
      const result = await sdk.callRestAPI(
        {
          id: id,
          name: data.name,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/hashtag");
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
        path: "hashtag",
      },
    });
  }, []);

  return (
    <EditAdminPageLayout
      title="Hashtag"
      backTo="hashtag"
      showDelete={false}
    >
      <form
        className=" w-full max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="name"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className={`"   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none${errors.name?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.name?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/hashtag")}
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

export default EditAdminHashTagPage;
