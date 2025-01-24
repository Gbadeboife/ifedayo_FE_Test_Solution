import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";

let sdk = new MkdSDK();

const EditAdminIdVerificationPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      type: yup.string().required(),
      expiry_date: yup.string().matches(/[0-9]{4}-[0-9]{2}-[0-9]{2}/, "Date Format YYYY-MM-DD"),
      status: yup.number().required().positive().integer(),
      image: yup.string().required(),
      user_id: yup.number().required().positive().integer(),
    })
    .required();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [expiry_date, setExpiryDate] = useState("");
  const [status, setStatus] = useState(0);
  const [image, setImage] = useState("");
  const [user_id, setUserId] = useState(0);
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
        sdk.setTable("id_verification");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        if (!result.error) {
          setType(result.model.type);
          setExpiryDate(result.model.expiry_date);
          setStatus(result.model.status);
          setImage(result.model.image);
          setUserId(result.model.user_id);
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
          type: data.type,
          expiry_date: data.expiry_date,
          status: data.status,
          image: data.image,
          user_id: data.user_id,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/id_verification");
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
      setError("type", {
        type: "manual",
        message: error.message,
      });
    }
  };
  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "id_verification",
      },
    });
  }, []);

  return (
    <div className=" shadow-md rounded   mx-auto p-5">
      <h4 className="text-2xl font-medium">Edit IdVerification</h4>
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="type"
          >
            Type
          </label>
          <input
            placeholder="type"
            {...register("type")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.type?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.type?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="expiry_date"
          >
            ExpiryDate
          </label>
          <input
            type="date"
            placeholder="expiry_date"
            {...register("expiry_date")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.expiry_date?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.expiry_date?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="status"
          >
            Status
          </label>
          <input
            placeholder="status"
            {...register("status")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.status?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.status?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="image"
          >
            Image
          </label>
          <textarea
            placeholder="image"
            {...register("image")}
            className={`"shadow   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${errors.image?.message ? "border-red-500" : ""}`}
            rows={15}
          ></textarea>
          <p className="text-red-500 text-xs italic">{errors.image?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="user_id"
          >
            UserId
          </label>
          <input
            placeholder="user_id"
            {...register("user_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.user_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.user_id?.message}</p>
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default EditAdminIdVerificationPage;
