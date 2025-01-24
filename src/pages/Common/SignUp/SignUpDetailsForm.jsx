import React from "react";
import { Navigate, useNavigate } from "react-router";
import { useSignUpContext } from "./signUpContext";

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

export default function SignUpDetailsForm() {
  const navigate = useNavigate();
  const { signUpData } = useSignUpContext();
  const role = signUpData.role;
  const { dispatch: authDispatch } = React.useContext(AuthContext);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const sdk = new MkdSDK();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [privacyOpen, setPrivacyModalOpen] = React.useState(false);
  const initialDate = useRef(new Date());

  function closeModal() {
    setModalOpen(false);
  }
  function closePrivacyModal() {
    setPrivacyModalOpen(false);
  }

  const schema = yup.object({
    firstName: yup.string(),
    lastName: yup.string(),
    dob: yup.date(),
    password: yup.string()
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

  async function onSubmit() {
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
          <div className={`${errors.password?.message && dirtyFields.password ? "border rounded-md border-[#C42945]" : "borde"} relative mb-4 flex justify-between rounded-md bg-transparent`}>
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

        
          <p className="mb-4 text-sm normal-case text-gray-500">
            Select and agree to {" "}
            <button
              type="button"
              onClick={() =>setModalOpen(true)}
              className="underline"
            // target={"_blank"}
            >
            {" "} Terms and Conditions
            </button>
            {" "}
            to continue.
            {" "}
            {" "}
            <button
              type="button"
              onClick={() =>setPrivacyModalOpen(true)}
              className="underline"
            >
             Privacy Policy
            </button>
          </p>
          <LoadingButton
            loading={loading}
            type="submit"
            className={`disabled:cursor-not-allowed login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"}`}
            // disabled={!recaptchaValidated}
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
          />
          <PrivacyAndPolicyModal
          isOpen={privacyOpen}
          closeModal={closePrivacyModal}
          />
    </>
  );
}
