import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";
import CustomComboBoxV2 from "@/components/CustomComboBoxV2";

const AddAdminIdVerificationPage = () => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [frontImage, setFrontImage] = React.useState();
  const [backImage, setBackImage] = React.useState();
  const [selectedVerification, setSelectedVerification] = React.useState("Passport");
  let sdk = new MkdSDK();

  const schema = yup
    .object({
      type: yup.string().required(),
      expiry_date: yup.string().test("is-not-in-past", "Not a valid date", (val) => {
        if (val == "") return false;
        const date = new Date(val);
        return date > new Date();
      }),
      status: yup.number().required().integer(),
      user_id: yup.string().required("Please select a user"),
    })
    .required();

  const { dispatch } = React.useContext(AuthContext);

  const navigate = useNavigate();
  const {
    control,
    setValue,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { user_id: "" },
  });

  const selectStatus = [
    { key: "0", value: "Pending" },
    { key: "1", value: "Verified" },
    { key: "2", value: "Declined" },
  ];

  const selectType = [
    { key: "Passport", value: "Passport" },
    { key: "Driver's License", value: "Driver's License" },
  ];

  const handleTypeChange = (e) => {
    setSelectedVerification(e.target.value);
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    for (let i = 0; i < file.length; i++) {
      formData.append("file", file[i]);
    }
    try {
      const upload = await sdk.uploadImage(formData);
      return upload.url;
    } catch (error) {
      tokenExpireError(dispatch, error.message);
    }
  };

  async function fetchUsersFiltered(emailFilter, setter, initialUserId) {
    try {
      var initial = [];
      if (+initialUserId) {
        const initialUserResult = await sdk.callRawAPI("/v2/api/custom/ergo/user/PAGINATE", { page: 1, limit: 1, where: [`${initialUserId ? `ergo_user.id = ${+initialUserId}` : ""}`] }, "POST");
        if (Array.isArray(initialUserResult.list)) {
          initial = initialUserResult.list;
        }
      }
      if (emailFilter) {
        const result = await sdk.callRawAPI("/v2/api/custom/ergo/user/PAGINATE", { page: 1, limit: 10, where: [`ergo_user.email LIKE '%${emailFilter}%'`] }, "POST");
        if (Array.isArray(result.list)) {
          setter([...initial, ...result.list]);
        }
      }
    } catch (err) {
      console.log("err", err);
    }
  }

  const verifyUserAndUploadImage = async (data) => {
    try {
      if (!frontImage) {
        setError("front_image", {
          type: "manual",
          message: "Image is required",
        });
      }
      if (!backImage) {
        setError("back_image", {
          type: "manual",
          message: "Image is required",
        });
      }
      if (!frontImage || (!backImage && selectedVerification != "Passport")) return;
      data.frontImage = await handleImageUpload(frontImage);
      if (selectedVerification == "Passport") {
        data.backImage = null;
      }
      if (backImage) {
        data.backImage = await handleImageUpload(backImage);
      }
      onSubmit(data);
    } catch (error) {
      console.log("Error", error);
      setError("type", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  const onSubmit = async (data) => {
    console.log("data", data);
    try {
      sdk.setTable("id_verification");
      const result = await sdk.callRestAPI(
        {
          type: data.type,
          expiry_date: data.expiry_date,
          status: data.status,
          image_front: data.frontImage,
          image_back: data.backImage,
          user_id: data.user_id,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
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
      tokenExpireError(dispatch, error.message);
      if (error.message == "Validation error") {
        updateIdVerification({
          type: data.type,
          expiry_date: data.expiry_date,
          status: data.status,
          image_front: data.frontImage,
          image_back: data.backImage,
          user_id: data.user_id,
        });
        return;
      }
      setError("type", {
        type: "manual",
        message: error.message,
      });
    }
  };

  const onError = (x, y) => {
    if (!frontImage) {
      setError("front_image", {
        type: "manual",
        message: "Image is required",
      });
    }
    if (!backImage && selectedVerification != "Password") {
      setError("back_image", {
        type: "manual",
        message: "Image is required",
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

  async function updateIdVerification(data) {
    try {
      sdk.setTable("id_verification");
      await sdk.callRestAPI({ set: data, where: { user_id: data.user_id } }, "PUTWHERE");
      showToast(globalDispatch, "Updated");
      navigate("/admin/id_verification");
    } catch (err) {
      tokenExpireError(dispatch, err);
      showToast(globalDispatch, err, 4000, "ERROR");
    }
  }

  return (
    <AddAdminPageLayout
      title={"ID Verification"}
      backTo={"id_verification"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(verifyUserAndUploadImage, onError)}
      >
        <div className="mb-5">
          <div className="mb-4 ">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="user_id"
            >
              User
            </label>
            <CustomComboBoxV2
              control={control}
              name="user_id"
              setValue={(val) => setValue("user_id", val)}
              valueField={"id"}
              labelField={"email"}
              getItems={fetchUsersFiltered}
              className="relative flex h-[40px] items-center rounded border px-3"
              placeholder="User email"
            />
            <p className="text-xs normal-case italic text-red-500">{errors.user_id?.message}</p>
          </div>
          <label
            htmlFor="type"
            className="mb-2 block text-sm font-bold text-gray-700"
          >
            Type
          </label>
          <select
            name="type"
            id="type"
            className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            {...register("type")}
            defaultValue={0}
            onChange={handleTypeChange}
          >
            {selectType.map((option) => (
              <option
                name="type"
                value={option.key}
                key={option.key}
              >
                {option.value}
              </option>
            ))}
          </select>
          <p className="text-xs normal-case italic text-red-500">{errors.type?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="expiry_date"
          >
            Expiry Date
          </label>
          <input
            type="date"
            placeholder="expiry_date"
            {...register("expiry_date")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.expiry_date?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.expiry_date?.message}</p>
        </div>

        <div className="mb-5">
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-bold text-gray-700"
          >
            Status
          </label>
          <select
            name="Status"
            id="status"
            className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            {...register("status")}
            defaultValue={0}
          >
            {selectStatus.map((option) => (
              <option
                name="status"
                value={option.key}
                key={option.key}
              >
                {option.value}
              </option>
            ))}
          </select>
          <p className="text-xs normal-case italic text-red-500">{errors.status?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="image"
          >
            {selectedVerification == "Passport" ? "Image" : "Front Image"}
          </label>
          <input
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-700 focus:outline-none"
            type="file"
            accept="image/png, image/gif, image/jpeg"
            name="file"
            onChange={(e) => {
              setFrontImage(e.target.files);
              clearErrors("front_image");
            }}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.front_image?.message}</p>
        </div>
        <div className={selectedVerification == "Passport" ? "hidden" : "mb-4"}>
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="image"
          >
            Back Image
          </label>
          <input
            className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-700 focus:outline-none"
            type="file"
            accept="image/png, image/gif, image/jpeg"
            name="file"
            onChange={(e) => {
              setBackImage(e.target.files);
              clearErrors("back_image");
            }}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.back_image?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/id_verification")}
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
    </AddAdminPageLayout>
  );
};

export default AddAdminIdVerificationPage;
