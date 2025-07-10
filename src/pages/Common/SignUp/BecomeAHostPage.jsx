import { AuthContext } from "@/authContext";
import { LoadingButton } from "@/components/frontend";
import DatePickerV2 from "@/components/frontend/DatePickerV2";
import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { NOTIFICATION_STATUS, NOTIFICATION_TYPE } from "@/utils/constants";
import MkdSDK from "@/utils/MkdSDK";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment/moment";
import React, { useContext, useEffect, useState, useRef } from "react";
import { FileUploader } from "react-drag-drop-files";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import countries from "@/utils/countries.json";
import * as yup from "yup";
import CustomLocationAutoCompleteV2 from "@/components/CustomLocationAutoCompleteV2";
import CustomComboBox from "@/components/CustomComboBox";
import ReCAPTCHA from "react-google-recaptcha";

const readImage = (file, previewEl) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById(previewEl).src = event.target.result;
  };

  reader.readAsDataURL(file);
};

async function getFileFromUrl(url) {
  if (!url) return null;
  try {
    let response = await fetch(url);
    let data = await response.blob();
    let metadata = {
      type: "image/jpeg",
    };
    return new File([data], url.split("/").pop(), metadata);
  } catch (err) {
    return null;
  }
}

export default function BecomeAHostPage() {
  const initialDate = useRef(new Date());
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch: authDispatch } = useContext(AuthContext);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageErr, setImageErr] = useState("");
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState("");

  const navigate = useNavigate();

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
    setRecaptchaError("");
  };

  const schema = yup.object({
    // dob: yup
    //   .string()
    //   .required("This field is required")
    //   .test("is-not-in-future", "Not a valid date", (val) => {
    //     if (val == "") return true;
    //     const date = new Date(val);
    //     return date.setDate(date.getDate() + 1) < new Date();
    //   }),
    expiry_date: yup
      .string()
      .required("This field is required")
      .test("is-not-in-past", "Invalid expiry date", (val) => {
        const date = new Date(val);
        return date.setDate(date.getDate() - 1) > new Date();
      }),
    city: yup.string().required("This field is required"),
    country: yup.string().required("This field is required"),
    selectedType: yup.string().required("This field is required"),
    about: yup.string().required("This field is required"),
  });

  const {
    handleSubmit,
    register,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      dob: globalState.user.dob ? moment(globalState.user.dob).format("yyyy-MM-DD") : "",
      expiry_date: globalState.user.verificationExpiry ? moment(globalState.user.verificationExpiry).format("yyyy-MM-DD") : "",
      city: globalState.user.city || "",
      country: globalState.user.country || "",
      selectedType: globalState.user.verificationType || "Driver's License",
      about: globalState.user.about || "",
    },
    resolver: yupResolver(schema),
  });
  const sdk = new MkdSDK();

  const selectedType = watch("selectedType");

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

  async function onSubmit(data) {
    // Check if reCAPTCHA is completed
    if (!recaptchaValue) {
      setRecaptchaError("Please complete the reCAPTCHA verification");
      return;
    }

    // check if images are uploaded
    if (selectedType == "Driver's License" && (!frontImage || !backImage)) {
      setImageErr("Please upload required documents");
      return;
    }

    if (selectedType == "Passport" && !passport) {
      setImageErr("Please upload required documents");
      return;
    }

    console.log("submitting", data);
    setLoading(true);
    try {
      // edit user
      await callCustomAPI(
        "edit-self",
        "post",
        {
          user: { role: ["superadmin", "admin"].includes(globalState.user.role) ? undefined : "host" },
          profile: {
            city: data.city,
            country: data.country,
            // dob: isSameDay(data.dob, initialDate.current) ? undefined : moment(data.dob).format("yyyy-MM-DD"),
            about: data.about,
            getting_started: 0,
          },
        },
        "",
      );
      // submit id verification
      if (selectedType == "Driver's License") {
        data.image_front = await handleImageUpload(frontImage);
        data.image_back = await handleImageUpload(backImage);
      } else {
        data.image_front = await handleImageUpload(passport);
      }

      sdk.setTable("id_verification");
      const result = await sdk.callRestAPI(
        {
          id: globalState.user.verificationId,
          type: selectedType,
          expiry_date: data.expiry_date,
          status: 0,
          image_front: data.image_front,
          image_back: data.image_back,
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

      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: {
          heading: "Success",
          message: `Host account created, please re login to your account`,
          btn: "Ok got it",
          onClose: () => {
            sdk.logout();
            authDispatch({ type: "LOGOUT" });
            navigate("/login");
          },
        },
      });
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const front = await getFileFromUrl(globalState.user.verificationImageFront);
      const back = await getFileFromUrl(globalState.user.verificationImageBack);
      if (globalState.user.verificationType == "Passport") {
        setPassport(front);
      } else {
        setFrontImage(front);
        setBackImage(back);
      }
    })();
  }, []);

  if (!globalState.user.id) return <Navigate to={"/"} />;

  return (
    <div className="mt-[120px] normal-case">
      <form
        className="mx-auto w-full max-w-5xl p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="mb-2 text-5xl">Become A Host</h1>
        <p className="mb-8">Gain the ability to rent your spaces by giving us some additional information</p>

        <h3 className="mb-8 text-2xl font-semibold">Location</h3>
        <div className="mb-16 max-w-lg">
          <div className="mb-8">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="city"
            >
              City
            </label>
            <CustomLocationAutoCompleteV2
              control={control}
              setValue={(val) => setValue("city", val)}
              name="city"
              className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.city?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
              placeholder=""
              hideIcons
              suggestionType={["(cities)"]}
            />

            {/* <div className="flex">
              <input
                placeholder=""
                type="text"
                {...register("city")}
                className={`focus:shadow-outline w-full rounded rounded-l-none border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.city?.message ? "border-red-600" : ""}`}
              />
            </div> */}
            <p className="mt-2 text-sm italic text-red-600 empty:mt-0">{errors.city?.message}</p>
          </div>
          <div className="mb-8">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="country"
            >
              Country
            </label>
            <CustomComboBox
              control={control}
              name="country"
              labelField="name"
              valueField="name"
              setValue={(val) => setValue("country", val)}
              items={countries}
              containerClassName="relative w-full"
              className={`w-full truncate border py-2 px-3 text-black ${errors.country?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
              placeholder=""
            />
            {/* <div className="flex">
              <input
                placeholder=""
                type="text"
                {...register("country")}
                className={`focus:shadow-outline w-full rounded rounded-l-none border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.country?.message ? "border-red-600" : ""}`}
              />
            </div> */}
            <p className="mt-2 text-sm italic text-red-600 empty:mt-0">{errors.country?.message}</p>
          </div>
        </div>
        <h3 className="mb-8 text-2xl font-semibold">Profile Information</h3>
        <div className={`mb-16 max-w-lg ${globalState.user.dob ? "hidden" : "hidden"}`}>
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="dob"
          >
            Date of birth <span className="ml-4 text-sm font-normal italic text-red-500">{errors.dob?.message}</span>
          </label>
          <DatePickerV2
            control={control}
            name="dob"
            min={new Date("1950-01-01")}
            max={initialDate.current}
            setValue={(v) => setValue("dob", v)}
          />
        </div>
        <div className="mb-16 max-w-lg">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="about"
          >
            About
          </label>
          <textarea
            className={`focus:shadow-outline w-full rounded rounded-l-none border-2 py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.about?.message ? "border-red-600" : ""}`}
            placeholder="Tell us about yourself"
            {...register("about")}
            cols="30"
            rows="10"
          ></textarea>
          <p className="mt-2 text-sm italic text-red-600 empty:mt-0">{errors.about?.message}</p>
        </div>

        <h3 className="mb-8 text-2xl font-semibold">Identity Verification</h3>
        <p className="mb-2 font-semibold">Explain what document(s) are allowed.</p>
        <div className="radio-container mb-8 flex max-w-lg justify-between">
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
        <p className="mb-2 text-sm italic text-red-600 empty:mb-0">{imageErr}</p>
        <div className="mb-8 text-[#667085]">
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
        <div className="mb-16 max-w-lg">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="expiry_date"
          >
            Expiry date <span className="ml-4 text-sm font-normal italic text-red-500">{errors.expiry_date?.message}</span>
          </label>
          <DatePickerV2
            control={control}
            name="expiry_date"
            min={initialDate.current}
            max={new Date("2050-01-01")}
            setValue={(v) => setValue("expiry_date", v)}
          />
        </div>

        {/* reCAPTCHA */}
        <div className="mb-6 flex justify-center">
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={handleRecaptchaChange}
            onExpired={() => setRecaptchaValue(null)}
          />
        </div>
        
        {recaptchaError && (
          <p className="error-vibrate my-3 rounded-md border border-[#C42945] bg-white py-2 px-3 text-center text-sm normal-case text-[#C42945]">{recaptchaError}</p>
        )}

        <div className="mb-16 flex gap-4">
          <Link
            to={-1}
            className="rounded border-2 border-gray-700 py-2 px-4 tracking-wide outline-none focus:outline-none"
          >
            Cancel
          </Link>
          <LoadingButton
            loading={loading}
            type="submit"
            disabled={!recaptchaValue}
            className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "bg-opacity-50 py-1 px-8" : "py-2"} px-4 ${!recaptchaValue ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Continue
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
