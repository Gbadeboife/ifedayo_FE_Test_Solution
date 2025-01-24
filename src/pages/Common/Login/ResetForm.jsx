import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { LoadingButton } from "@/components/frontend";
import moment from "moment";
import commonPasswords from "../SignUp/common-passwords.json";
import { callCustomAPI } from "@/utils/callCustomAPI";

const ResetForm = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "customer";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = yup.object({
    code: yup.number().required("Code is required").typeError("Code is required").positive("Invalid Code").integer(),
    password: yup
      .string()
      .required("Password is required")
      .min(10, "Password must be at least 10 characters long")
      .matches(/^(?=.*[0-9])/, "Password must contain at least one digit(0-9)")
      .matches(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
      .matches(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
      .matches(/^(?=.*[!@#\$%\^&\*])/, "Password must contain at least one symbol")
      .test("is-not-dictionary", "Password must not contain a common word", (val) => {
        return commonPasswords.every((pass) => !val.includes(pass));
      })
      .test("does-not-contain-user-info", "Password must not contain your name or date of birth", (val) => {
        const d = moment("2001-01-01");
        return ["john", "doe", d.format("yyyyMMDD"), d.format("DDMMyyyy"), d.format("MMDDyyyy"), d.format("YYMMDD"), d.format("MMDDYY"), d.format("DDMMYY")].every(
          (field) => field.trim() == "" || !val.toLowerCase().includes(field.toLowerCase()),
        );
      }),
    confirm_password: yup.string().oneOf([yup.ref("password"), null], "Passwords don't match"),
  });
  const {
    handleSubmit,
    register,
    trigger,
    formState: { errors, dirtyFields },
    setError,
  } = useForm({ resolver: yupResolver(schema), defaultValues: { password: "" }, criteriaMode: "all" });

  const navigate = useNavigate();

  const sdk = new MkdSDK();

  const onSubmit = async (data) => {
    console.log("submitting", data);
    setLoading(true);
    try {
      // await sdk.reset(searchParams.get("token"), data.code, data.password);
      await callCustomAPI("reset", "post", { code: data.code, password: data.password, token: searchParams.get("token") }, "");
      navigate("/login?role=" + role);
    } catch (err) {
      setError("code", { message: err.message == "Password is same as old password" ? "Please use a different password" : err.message });
    }
    setLoading(false);
  };

  function getPasswordErrors() {
    var arr = [];
    if (Array.isArray(errors.password?.types.matches)) {
      arr = [...errors.password.types.matches];
    }
    if (typeof errors.password?.types.matches === "string") {
      arr.push(errors.password.types.matches);
    }
    if (errors.password?.types.min) {
      arr.push(errors.password.types.min);
    }
    if (errors.password?.types["does-not-contain-user-info"]) {
      arr.push(errors.password?.types["does-not-contain-user-info"]);
    }
    if (errors.password?.types["is-not-dictionary"]) {
      arr.push(errors.password?.types["is-not-dictionary"]);
    }
    return arr;
  }
  const passwordErrors = getPasswordErrors();

  return (
    <div className="bg-login flex h-screen items-center justify-center">
      <form
        className="flex w-96 flex-col bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <h2 className="mb-4 text-2xl font-semibold">Set New Password</h2>

        <input
          type="text"
          inputMode="numeric"
          {...register("code")}
          className="remove-arrows mb-4 border-2 py-2 px-4 focus:outline-none"
          autoComplete="off"
          placeholder="Enter code"
        />
        <div className="relative mb-4 flex justify-between rounded-sm border-2 bg-transparent">
          <input
            autoComplete={showPassword ? "off" : "new-password"}
            type={showPassword ? "text" : "password"}
            {...register("password", { onChange: () => trigger("password") })}
            className="flex-grow border-0 p-2 px-4 focus:outline-none active:outline-none "
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
            {passwordErrors.map((msg) => (
              <p>{msg}</p>
            ))}
          </div>
        )}
        <div className="relative mb-4 flex justify-between rounded-sm border-2 bg-transparent">
          <input
            autoComplete={showConfirmPassword ? "off" : "new-password"}
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirm_password")}
            className="flex-grow border-0 p-2 px-4 focus:outline-none active:outline-none "
            placeholder="Confirm password"
          />{" "}
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-1 top-[20%]"
          >
            {" "}
            {showConfirmPassword ? (
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
        {Object.entries(errors).length > 0 && dirtyFields.password && !errors.password ? (
          <p className="error-vibrate my-3 rounded-md border border-[#C42945] bg-white py-2 px-3 text-center text-sm normal-case text-[#C42945]">{Object.values(errors)[0].message}</p>
        ) : null}
        <LoadingButton
          loading={loading}
          type="submit"
          className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none  ${loading ? "loading py-1" : "py-2"}`}
        >
          Continue
        </LoadingButton>
      </form>
    </div>
  );
};

export default ResetForm;
