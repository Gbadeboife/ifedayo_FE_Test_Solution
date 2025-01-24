import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import Icon from "@/components/Icons";
import { FileUploader } from "react-drag-drop-files";
import { useState } from "react";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import GreenCheckIcon from "@/components/frontend/icons/GreenCheckIcon";
import SecurityIcon from "@/components/frontend/icons/SecurityIcon";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { LoadingButton } from "@/components/frontend";
import { NOTIFICATION_STATUS, NOTIFICATION_TYPE } from "@/utils/constants";
import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import { useSearchParams } from "react-router-dom";

let sdk = new MkdSDK();

export default function CustomerVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const schema = yup.object({
    expiry_date: yup.string().test("is-not-in-past", "Not a valid date", (val) => {
      if (val == "") return false;
      const date = new Date(val);
      return date.setDate(date.getDate() - 1) > new Date();
    }),
  });

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { selectedType: "Driver's License" }, resolver: yupResolver(schema) });

  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);

  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const { dispatch: authDispatch } = useContext(AuthContext);

  const [verified, setVerified] = useState(false);
  const showVerified = useDelayUnmount(verified, 300);

  const selectedType = watch("selectedType");

  const isDisabled = () => {
    if (selectedType == "Driver's License" && frontImage && backImage) return false;
    if (selectedType == "Passport" && passport) return false;
    return true;
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const upload = await sdk.uploadImage(formData);
      return upload.url;
    } catch (err) {
      console.log("err", err);
      return "";
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (selectedType == "Driver's License") {
        data.frontImage = await handleImageUpload(frontImage);
        data.backImage = await handleImageUpload(backImage);
      } else {
        data.frontImage = await handleImageUpload(passport);
      }
      sdk.setTable("id_verification");
      const result = await sdk.callRestAPI(
        {
          id: globalState.user.verificationId,
          type: selectedType,
          expiry_date: data.expiry_date,
          status: 0,
          image_front: data.frontImage,
          image_back: data.backImage ?? null,
          user_id: Number(localStorage.getItem("user")),
        },
        globalState.user.verificationId ? "PUT" : "POST",
      );

      // create notification
      sdk.setTable("notification");
      await sdk.callRestAPI(
        {
          user_id: Number(localStorage.getItem("user")),
          actor_id: null,
          action_id: result.message,
          notification_time: new Date().toISOString().split(".")[0],
          message: "New ID Verification submitted",
          type: NOTIFICATION_TYPE.NEW_ID_VERIFICATION,
          status: NOTIFICATION_STATUS.NOT_ADDRESSED,
        },
        "POST",
      );

      setVerified(true);
    } catch (err) {
      tokenExpireError(authDispatch, err.message);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    setLoading(false);
  };

  const readImage = (file, previewEl) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById(previewEl).src = event.target.result;
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="pb-16 normal-case">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
        >
          <Icon
            type="arrow"
            variant="narrow-left"
            className="h-4 w-4 stroke-[#667085]"
          />{" "}
          <span className="ml-2">Back</span>
        </button>
      </div>
      <h1 className="mb-4 text-2xl font-semibold md:text-5xl">Identity Verification</h1>
      <div className="mb-[32px] max-w-3xl rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-[24px] py-[16px]">
        <h3 className="text-lg flex items-center gap-2 font-semibold">
          <SecurityIcon />
          <span>Safety is our priority</span>
        </h3>
        <p className="ml-5 max-w-xl text-sm leading-relaxed">
          To establish trust for all parties we verify both hosts and guests. Your personal information is secure. We will never share your information with third parties.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <p className="mb-2 font-semibold">Verification Documents.</p>
        <div data-tour="fifth-step" className="fifth-step radio-container mb-8 flex justify-between md:max-w-lg">
          <label
            htmlFor="driversLicense"
            className="cursor-pointer"
          >
            <input
              type="radio"
              id="driversLicense"
              {...register("selectedType")}
              className="mr-2"
              value="Driver's License"
            />
            <span></span>
            Driver's License
          </label>
          <label
            htmlFor="passport"
            className="cursor-pointer"
          >
            <input
              type="radio"
              id="passport"
              {...register("selectedType")}
              className="mr-2"
              value="Passport"
            />
            <span></span>
            Passport
          </label>
        </div>
        <div className="text-[#667085]">
          {selectedType == "Driver's License" ? (
            <div className="flex flex-col items-center gap-[16px] md:flex-row">
              <FileUploader
                multiple={false}
                handleChange={(file) => {
                  setFrontImage(file);
                }}
                types={["SVG", "JPEG", "PNG", "GIF", "JPG"]}
              >
                <div className="flex h-[130px] w-full max-w-full cursor-pointer flex-col items-center justify-center gap-[12px] border-2 border-dashed border-[#D0D5DD] text-sm md:w-[333px]">
                  {frontImage?.name ? (
                    <img
                      src={readImage(frontImage, "front-preview")}
                      id="front-preview"
                      className="h-full w-full rounded-sm object-cover"
                    />
                  ) : (
                    <>
                      <h4 className="text-xl font-semibold">Front</h4>
                      <p className="px-[20px]">
                        <strong className="font-semibold underline">Click to upload</strong> or drag and drop SVG, PNG, JPG or GIF (max. 800x400px)
                      </p>
                    </>
                  )}
                </div>
              </FileUploader>
              <FileUploader
                multiple={false}
                handleChange={(file) => {
                  setBackImage(file);
                }}
                types={["SVG", "JPEG", "PNG", "GIF", "JPG"]}
              >
                <div className="flex h-[130px] w-full max-w-full cursor-pointer flex-col items-center justify-center gap-[12px] border-2 border-dashed border-[#D0D5DD] text-sm md:w-[333px]">
                  {backImage?.name ? (
                    <img
                      src={readImage(backImage, "back-preview")}
                      id="back-preview"
                      className="h-full w-full rounded-sm object-cover"
                    />
                  ) : (
                    <>
                      <h4 className="text-xl font-semibold">Back</h4>
                      <p className="px-[20px]">
                        <strong className="font-semibold underline">Click to upload</strong> or drag and drop SVG, PNG, JPG or GIF (max. 800x400px)
                      </p>
                    </>
                  )}
                </div>
              </FileUploader>
            </div>
          ) : (
            <FileUploader
              multiple={false}
              handleChange={(file) => {
                setPassport(file);
              }}
              types={["SVG", "JPEG", "PNG", "GIF", "JPG"]}
            >
              <div className="flex h-[130px] w-full max-w-full cursor-pointer flex-col items-center justify-center gap-[12px] border-2 border-dashed border-[#D0D5DD]  text-sm md:w-[333px]">
                {passport?.name ? (
                  <img
                    src={readImage(passport, "passport-preview")}
                    id="passport-preview"
                    className="h-full w-full rounded-sm object-cover"
                  />
                ) : (
                  <>
                    <h4 className="text-xl font-semibold">Passport page with photo</h4>
                    <p className="px-[20px]">
                      <strong className="font-semibold underline">Click to upload</strong> or drag and drop SVG, PNG, JPG or GIF (max. 800x400px)
                    </p>
                  </>
                )}
              </div>
            </FileUploader>
          )}
        </div>
        <div className="my-8 max-w-lg">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="expiry_date"
          >
            Expiration Date
          </label>
          <input
            type="date"
            placeholder="expiry_date"
            {...register("expiry_date")}
            className={`focus:shadow-outline !min-h-[40px] w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none`}
          />
          {errors.expiry_date?.message && <p className="my-3 rounded-md border border-[#C42945] bg-white py-2 px-3 text-center text-sm normal-case text-[#C42945]">{errors.expiry_date?.message}</p>}
        </div>
        <LoadingButton
          loading={loading}
          type="submit"
          className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"} mt-8 w-[333px] max-w-full`}
          disabled={isDisabled()}
        >
          Submit Document
        </LoadingButton>
      </form>
      <div className={showVerified ? "popup-container flex items-center justify-center normal-case" : "hidden"}>
        <div
          className={`${verified ? "pop-in" : "pop-out"} w-[510px] max-w-[80%] rounded-lg bg-white p-5 px-3 md:px-5`}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="mb-4 text-3xl font-semibold">
            <GreenCheckIcon />
            Document received
          </h2>
          <p className="mb-4 text-sm text-gray-500">Once we verify your document you will receive an email. It usually takes up to 24 hours.</p>
          <button
            type="button"
            className="login-btn-gradient mt-4 w-full rounded py-2 tracking-wide text-white  outline-none focus:outline-none"
            onClick={() => {
              setVerified(false);
              navigate(searchParams.get("redirect_uri") ?? -1);
            }}
          >
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
