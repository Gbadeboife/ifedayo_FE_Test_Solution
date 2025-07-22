import React from "react";
import { Navigate, useNavigate } from "react-router";
import { useSignUpContext } from "./signUpContext";
import ReCAPTCHA from "react-google-recaptcha";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { AuthContext } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { Link } from "react-router-dom";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { useRef } from "react";
import { isSameDay } from "@/utils/date-time-utils";
import moment from "moment/moment";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import DatePickerV2 from "@/components/frontend/DatePickerV2";
import { LoadingButton } from "@/components/frontend";
import PrivacyAndPolicyModal from "./PrivacyAndPolicyModal";
import commonPasswords from "@/assets/json/common-passwords.json";

export default function SignUpDetailsForm() {
  const navigate = useNavigate();
  const { signUpData } = useSignUpContext();
  const role = signUpData.role;
  const { dispatch: authDispatch } = React.useContext(AuthContext);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [recaptchaValue, setRecaptchaValue] = React.useState(null);
  const [recaptchaError, setRecaptchaError] = React.useState("");
  const sdk = new MkdSDK();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [privacyOpen, setPrivacyModalOpen] = React.useState(false);
  const [termsAgreed, setTermsAgreed] = React.useState(false);
  const [privacyRead, setPrivacyRead] = React.useState(false);
  const initialDate = useRef(new Date());

  function closeModal() {
    setModalOpen(false);
  }
  function closePrivacyModal() {
    setPrivacyModalOpen(false);
  }

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
    setRecaptchaError("");
  };

  const schema = yup.object({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    dob: yup
      .date()
      .required("Date of birth is required")
      .test("must-be-at-least-18yo", "Must be at least 18 years of age", (val) => {
        if (!val) return false;
        return moment().diff(moment(val), "years") >= 18;
      }),
    password: yup
      .string()
      .required("Password is required")
      .min(10, "Password must be at least 10 characters long")
      .matches(/^(?=.*[0-9])/, "Password must contain at least one digit(0-9)")
      .matches(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
      .matches(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
      .matches(/^(?=.*[!@#\$%\^&\*])/, "Password must contain at least one symbol")
      .test("is-not-dictionary", "Password must not contain a common word", (val) => {
        return commonPasswords.every((pass) => !val.toLowerCase().includes(pass.toLowerCase()));
      })
      .test("does-not-contain-user-info", "Password must not contain your name or date of birth", (val, ctx) => {
        const d = moment(ctx.parent.dob);
        return [
          ctx.parent.firstName,
          ctx.parent.lastName,
          d.format("yyyyMMDD"),
          d.format("DDMMyyyy"),
          d.format("MMDDyyyy"),
          d.format("YYMMDD"),
          d.format("MMDDYY"),
          d.format("DDMMYY"),
        ].every((field) => !field || field.trim() === "" || !val.toLowerCase().includes(field.toLowerCase()));
      }),
  });

  const {
    register,
    setError,
    handleSubmit,
    trigger,
    watch,
    setValue,
    control,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: signUpData.firstName,
      lastName: signUpData.lastName,
      dob: initialDate.current,
      password: signUpData.password,
    },
    criteriaMode: "all",
  });

  const data = watch();

  function getPasswordErrors() {
    var arr = [];
    if (Array.isArray(errors.password?.types?.matches)) {
      arr = [...errors.password.types.matches];
    }
    if (typeof errors.password?.types?.matches === "string") {
      arr.push(errors.password.types.matches);
    }
    if (errors.password?.types?.min) {
      arr.push(errors.password.types.min);
    }
    if (errors.password?.types?.["does-not-contain-user-info"]) {
      arr.push(errors.password.types["does-not-contain-user-info"]);
    }
    if (errors.password?.types?.["is-not-dictionary"]) {
      arr.push(errors.password.types["is-not-dictionary"]);
    }
    return arr;
  }
  const passwordErrors = getPasswordErrors();

  // Check if all validations pass
  const isFormValid = () => {
    return (
      recaptchaValue &&
      termsAgreed &&
      privacyRead &&
      !errors.firstName &&
      !errors.lastName &&
      !errors.dob &&
      !errors.password &&
      data.firstName &&
      data.lastName &&
      data.dob &&
      data.password
    );
  };

  async function onSubmit() {
    // Check if reCAPTCHA is completed
    if (!recaptchaValue) {
      setRecaptchaError("Please complete the reCAPTCHA verification");
      return;
    }

    // Check agreements
    if (!termsAgreed) {
      setError("firstName", {
        type: "manual",
        message: "Please agree to Terms and Conditions",
      });
      return;
    }

    if (!privacyRead) {
      setError("firstName", {
        type: "manual",
        message: "Please read and agree to Privacy Policy",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await sdk.register(signUpData.email, data.password, role);
      if (!result.error) {
        localStorage.setItem("token", result.token);

        // register device
        sdk.setTable("device");
        await sdk.callRestAPI({ active: 1, user_id: result.user_id, last_login_time: new Date().toISOString().split("T")[0], uid: localStorage.getItem("device-uid") }, "POST");

        await callCustomAPI(
          "edit-self",
          "post",
          {
            user: {
              first_name: data.firstName,
              last_name: data.lastName,
            },
            profile: {
              dob: isSameDay(data.dob, initialDate.current) ? undefined : moment(data.dob).format("yyyy-MM-DD"),
            },
          },
          "",
          result.token,
        );

        localStorage.removeItem("token");

        authDispatch({ type: "ALLOW_CHECK_VERIFICATION" });
        navigate("/check-verification");
        localStorage.setItem("first_login", result.user_id);
      setLoading(false);
      } else {
        setLoading(false);
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

    } catch (err) {
      setLoading(false);
      setError("firstName", {
        type: "manual",
        message: err.message,
      });
    }
  }

  if (!signUpData.email) return <Navigate to={`/signup`} />;

  return (
    <>
      <section className="flex flex-col items-center justify-center bg-white md:w-1/2">
        <form
          className="flex w-full max-w-md flex-col px-6"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <h1 className="mb-8 text-center text-5xl font-bold">Finish Signing Up</h1>
          <div className="mb-8">
            <input
              type="text"
              {...register("firstName")}
              className="w-full resize-none rounded-md border bg-transparent py-2 px-4 focus:outline-none active:outline-none"
              placeholder="First name"
              autoComplete="off"
            />
            <p className="text-red-500 text-xs italic mt-2 block">{errors.firstName?.message}</p>
          </div>

          <div className="mb-8">
            <input
              type="text"
              {...register("lastName")}
              className="w-full resize-none rounded-md border bg-transparent py-2 px-4 focus:outline-none active:outline-none"
              placeholder="Last name"
              autoComplete="off"
            />
            <p className="text-red-500 text-xs italic mt-2 block">{errors.lastName?.message}</p>
          </div>

          <DatePickerV2
            control={control}
            name="dob"
            min={new Date("1950-01-01")}
            max={initialDate.current}
            setValue={(v) => setValue("dob", v)}
          />
          {errors.dob && (
            <p className="text-red-500 text-xs italic mt-2 block">{errors.dob.message}</p>
          )}
          
          <div className={`${errors.password?.message && dirtyFields.password ? "border rounded-md border-[#C42945]" : "border"} relative mb-4 flex justify-between rounded-md bg-transparent`}>
            <input
              autoComplete={showPassword ? "off" : "new-password"}
              type={showPassword ? "text" : "password"}
              {...register("password", {
                onChange: () => {
                  trigger("password");
                },
              })}
              className="flex-grow rounded-md border p-2 px-4 focus:outline-none active:outline-none "
              placeholder="Password"
            />{" "}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-1 top-[20%]"
            >
              {" "}
              {showPassword ? (
                <img
                  src="/show.png"
                  alt=""
                  className="mr-2 w-6"
                />
              ) : (
                <img
                  src="/invisible.png"
                  alt=""
                  className="mr-2 w-6"
                />
              )}
            </button>
          </div>
          {dirtyFields.password && (
            <div className="fade-in mb-4 space-y-2 rounded-sm border border-[#C42945] p-3 text-sm normal-case text-[#C42945] empty:hidden">
              {passwordErrors.map((msg, idx) => (
                <p key={idx}>{msg}</p>
              ))}
            </div>
          )}

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
        
          <div className="mb-4 space-y-3">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms-agreement"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms-agreement" className="text-sm normal-case text-gray-500">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="underline"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>
            
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="privacy-agreement"
                checked={privacyRead}
                onChange={() => setPrivacyModalOpen(true)}
                className="mt-1"
              />
              <label htmlFor="privacy-agreement" className="text-sm normal-case text-gray-500">
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setPrivacyModalOpen(true)}
                  className="underline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>
          
          <LoadingButton
            loading={loading}
            type="submit"
            disabled={!isFormValid()}
            className={`disabled:cursor-not-allowed login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"} ${!isFormValid() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Continue
          </LoadingButton>
        </form>
      </section>
      <section
        style={{ backgroundImage: `url(${role == "host" ? "/host-sign-up.jpg" : "/sign-up-bg.jpg"})`, backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
        className="hidden w-1/2 md:block"
      >
      </section>
          <TermsAndConditionsModal
          isOpen={modalOpen}
          closeModal={closeModal}
          setIsAgreed={setTermsAgreed}
          isAgreed={termsAgreed}
          />
          <PrivacyAndPolicyModal
          isOpen={privacyOpen}
          closeModal={closePrivacyModal}
          setIsRead={setPrivacyRead}
          isRead={privacyRead}
          />
    </>
  );
}
