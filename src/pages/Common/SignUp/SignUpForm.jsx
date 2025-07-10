import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useSignUpContext } from "./signUpContext";
import { callCustomAPI, oauthLoginApi } from "@/utils/callCustomAPI";
import { LoadingButton } from "@/components/frontend";
import TLDs from "@/assets/json/email-tlds.json";

const SignUpForm = () => {
  const navigate = useNavigate();
  const { signUpData, dispatch } = useSignUpContext();
  const role = signUpData.role;
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState("");
  
  const schema = yup.object({
    email: yup
      .string()
      .email("Please enter a valid email address")
      .required("Email is required")
      .test("valid-tld", "Please enter a valid email address", function(value) {
        if (!value) return false;
        const emailParts = value.split("@");
        if (emailParts.length !== 2) return false;
        const tld = emailParts[1].toLowerCase();
        return TLDs.includes(tld);
      }),
  });
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: signUpData.email,
    },
  });

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
    setRecaptchaError("");
  };

  const onSubmit = async (data) => {
    // Check if reCAPTCHA is completed
    if (!recaptchaValue) {
      setRecaptchaError("Please complete the reCAPTCHA verification");
      return;
    }

    setLoading(true);
    try {
      const result = await callCustomAPI("email-exist", "post", { email: data.email }, "");

      if (result.error || result.exist) throw new Error("User already exists");

      dispatch({ type: "SET_EMAIL", payload: data.email });
      navigate("/signup/details" + "?role=" + role);
    } catch (err) {
      setError("email", { type: "manual", message: err.message });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const result = await oauthLoginApi("google", role);
    window.open(result.data, "_self");
  };

  const handleFacebookLogin = async () => {
    const result = await oauthLoginApi("facebook", role);
    window.open(result.data, "_self");
  };

  const handleAppleLogin = async () => {
    const result = await oauthLoginApi("apple", role);
    window.open(result.data, "_self");
  };

  if (!signUpData.role) return <Navigate to={"/signup/select-role"} />;

  return (
    <>
      <section className="flex flex-col items-center justify-center w-full bg-white md:w-1/2">
        <form
          className="flex flex-col w-full max-w-md px-6"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <h1 className="mb-8 text-3xl font-semibold text-center md:text-5xl md:font-bold">{role == "host" ? "Become a host" : "Sign up"}</h1>
          <input
            autoComplete="off"
            {...register("email")}
            type="email"
            className="p-2 px-4 mb-8 bg-transparent border-2 rounded-sm resize-none focus:outline-none active:outline-none"
            placeholder="Email"
          />
          {Object.entries(errors).length > 0 ? (
            <p className="error-vibrate my-3 rounded-md border border-[#C42945] bg-white py-2 px-3 text-center text-sm normal-case text-[#C42945]">{Object.values(errors)[0].message}</p>
          ) : (
            <></>
          )}
          
          {/* reCAPTCHA */}
          <div className="flex justify-center mb-6">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={handleRecaptchaChange}
              onExpired={() => setRecaptchaValue(null)}
            />
          </div>
          
          {recaptchaError && (
            <p className="error-vibrate my-3 rounded-md border border-[#C42945] bg-white py-2 px-3 text-center text-sm normal-case text-[#C42945]">{recaptchaError}</p>
          )}
          
          <LoadingButton
            loading={loading}
            type="submit"
            disabled={!recaptchaValue}
            className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"} ${!recaptchaValue ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Continue
          </LoadingButton>

        </form>
        <div className="my-6 text-center hr">OR</div>
        <div className="oauth flex w-full max-w-md flex-col gap-4 px-6 text-[#344054]">
          <button
            onClick={() => handleGoogleLogin()}
            className="flex items-center justify-center gap-2 border-2 py-[10px]"
          >
            <img
              src="/google-icon.png"
              className="h-[18px] w-[18px]"
            />
            <span>Sign Up With Google</span>
          </button>
          <button
            onClick={() => handleFacebookLogin()}
            className="flex items-center justify-center gap-2 border-2 py-[10px]"
          >
            <img
              src="/facebook-icon.png"
              className="h-[16px] w-[16px]"
            />
            <span>Sign Up With Facebook</span>
          </button>
          <button
            onClick={() => handleAppleLogin()}
            className="flex items-center justify-center gap-2 border-2 py-[10px]"
          >
            <img
              src="/apple-icon.png"
              className="h-[16px] w-[16px]"
            />
            <span>Sign Up With Apple</span>
          </button>
          <div>
            <h3 className="text-sm text-center text-gray-800 normal-case">
              Already have an account?{" "}
              <Link
                to={"/login" + "?role=" + role}
                className="self-end mb-8 text-sm font-semibold my-text-gradient"
              >
                Log In
              </Link>{" "}
            </h3>
          </div>
        </div>
      </section>
      <section
        style={{ backgroundImage: `url(${role == "host" ? "/jumbotron1.jpg" : "/sign-up-bg.jpg"})`, backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
        className="hidden w-1/2 bg-contain md:block"
      ></section>
    </>
  );
};

export default SignUpForm;
