import { GlobalContext, showToast } from "@/globalContext";
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useContext } from "react";
import GreenCheckIcon from "./frontend/icons/GreenCheckIcon";
import { useNavigate } from "react-router";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { LoadingButton } from "./frontend";

export default function HostAddAmenityModal({setAmenityModal,getData}) {
  let sdk = new MkdSDK();
  const { state, dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [loading, setLoading] = React.useState();
  const schema = yup
    .object({
        name: yup.string().required("Name is required"),
    })
    .required();

  const { dispatch } = React.useContext(AuthContext);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      sdk.setTable("amenity");

      const result = await sdk.callRestAPI(
        {
          name: data.name,
          creator_id: Number(localStorage.getItem("user")),
          space_id: data.space_id || null,
        },
        "POST",
      );
      if (!result.error) {
        getData();
        showToast(globalDispatch, "Amenity Added");
    setLoading(false)
    setAmenityModal(false)
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
      tokenExpireError(dispatch, error.message);
    }
  };

  return (
    <div className={"popup-container flex items-center justify-center normal-case"}>
      <div
        className={`w-[510px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
        onClick={(e) => e.stopPropagation()}
      >
       <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
      >

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="add_on_id"
          >
            Amenity
          </label>
          <input
          type="text"
            className="mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            {...register("name")}
            placeholder="Amenity Name"
          />
          <p className="text-xs normal-case italic text-red-500">{errors.name?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() =>setAmenityModal(false)}
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
    </div>
  );
}
