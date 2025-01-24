import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";

const AddAdminHashtag = () => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const schema = yup
    .object({
      name: yup.string().required("Name is required"),
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
      sdk.setTable("hashtag");
      const result = await sdk.callRestAPI(
        {
          name: data.name,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
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
      tokenExpireError(dispatch, error.message);
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
    <AddAdminPageLayout
      title={"Hashtag"}
      backTo={"hashtag"}
    >
      <div className="p-5 border-t-0">
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
      </div>
    </AddAdminPageLayout>
  );
};

export default AddAdminHashtag;
