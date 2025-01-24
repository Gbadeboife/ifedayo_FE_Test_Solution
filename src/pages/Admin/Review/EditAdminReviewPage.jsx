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

const EditAdminReviewPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      customer_id: yup.number().required().positive().integer(),
      property_id: yup.number().required().positive().integer(),
      host_id: yup.number().required().positive().integer(),
      property_spaces_id: yup.number().required().positive().integer(),
      host_rating: yup.number().required().positive().integer(),
      space_rating: yup.number().required().positive().integer(),
      comment: yup.string().required(),
      hashtags: yup.string().required(),
    })
    .required();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const [customer_id, setCustomerId] = useState(0);
  const [property_id, setPropertyId] = useState(0);
  const [host_id, setHostId] = useState(0);
  const [property_spaces_id, setPropertySpacesId] = useState(0);
  const [host_rating, setHostRating] = useState(0);
  const [space_rating, setSpaceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hashtags, setHashtags] = useState("");
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
        sdk.setTable("review");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        if (!result.error) {
          setValue("customer_id", result.model.customer_id);
          setValue("property_id", result.model.property_id);
          setValue("host_id", result.model.host_id);
          setValue("property_spaces_id", result.model.property_spaces_id);
          setValue("host_rating", result.model.host_rating);
          setValue("space_rating", result.model.space_rating);
          setValue("comment", result.model.comment);
          setValue("hashtags", result.model.hashtags);
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
          customer_id: data.customer_id,
          property_id: data.property_id,
          host_id: data.host_id,
          property_spaces_id: data.property_spaces_id,
          host_rating: data.host_rating,
          space_rating: data.space_rating,
          comment: data.comment,
          hashtags: data.hashtags,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/review");
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
      setError("customer_id", {
        type: "manual",
        message: error.message,
      });
    }
  };
  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "review",
      },
    });
  }, []);

  return (
    <EditAdminPageLayout
      title="Review"
      backTo="review"
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="customer_id"
          >
            CustomerId
          </label>
          <input
            placeholder="customer_id"
            {...register("customer_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.customer_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.customer_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_id"
          >
            PropertyId
          </label>
          <input
            placeholder="property_id"
            {...register("property_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.property_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.property_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="host_id"
          >
            HostId
          </label>
          <input
            placeholder="host_id"
            {...register("host_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.host_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.host_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_spaces_id"
          >
            PropertySpacesId
          </label>
          <input
            placeholder="property_spaces_id"
            {...register("property_spaces_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.property_spaces_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.property_spaces_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="host_rating"
          >
            HostRating
          </label>
          <input
            placeholder="host_rating"
            {...register("host_rating")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.host_rating?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.host_rating?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="space_rating"
          >
            SpaceRating
          </label>
          <input
            placeholder="space_rating"
            {...register("space_rating")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.space_rating?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic">{errors.space_rating?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="comment"
          >
            Comment
          </label>
          <textarea
            placeholder="comment"
            {...register("comment")}
            className={`"shadow   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${errors.comment?.message ? "border-red-500" : ""}`}
            rows={15}
          ></textarea>
          <p className="text-red-500 text-xs italic">{errors.comment?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="hashtags"
          >
            Hashtags
          </label>
          <textarea
            placeholder="hashtags"
            {...register("hashtags")}
            className={`"shadow   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${errors.hashtags?.message ? "border-red-500" : ""}`}
            rows={15}
          ></textarea>
          <p className="text-red-500 text-xs italic">{errors.hashtags?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/review")}
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

export default EditAdminReviewPage;
