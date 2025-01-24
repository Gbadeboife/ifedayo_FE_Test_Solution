import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import GreenCheckIcon from "@/components/frontend/icons/GreenCheckIcon";
import MkdSDK from "@/utils/MkdSDK";
import { LoadingButton } from "@/components/frontend";
import Icon from "@/components/Icons";

export default function RequestReset() {
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sdk = new MkdSDK();

  const schema = yup.object({
    email: yup.string().email("Invalid email").required("Email is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    console.log("submitting", data);
    setLoading(true);
    const role = await sdk.callRawAPI("/v2/api/custom/ergo/userinfo/PAGINATE", {
      "where": [
        `email='${data.email}'`
      ],
      "page": 1,
      "limit": 10
    }, "POST");
    const originalRole = (role?.list[0]?.role)

    try {
      await sdk.forgot(data.email, originalRole);
      setCodeSent(true);
      setTimeout(() => {
        navigate("/login");
      }, 6000);
    } catch (err) {
      setError("email", {
        type: "manual",
        message: err.message,
      });
    }
    setLoading(false);
  };

  return (
    <div>
      <header className="absolute top-0 left-0 pt-4 md:pl-16 pl-6">
        <Link to="/">
          <Icon
            type="logo"
            fill="fill-[#101828]"
          />
        </Link>
      </header>
      <div className="bg-login h-screen flex items-center justify-center relative normal-case">
        {!codeSent && (
          <form
            className="bg-white p-5 w-[472px] flex flex-col mb-40"
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="off"
          >
            <h2 className="mb-4 text-2xl font-semibold">Request Password Reset</h2>
            <p className="mb-4 text-gray-500 text-lg">We will email you a link to reset your password.</p>
            <input
              autoComplete="off"
              type="text"
              {...register("email")}
              className="resize-none border-2 rounded-sm p-2 px-4 bg-transparent mb-4 focus:outline-none active:outline-none"
              placeholder="Email"
            />
            {errors.email?.message ? (
              <p className="border border-[#C42945] py-2 px-3 rounded-md bg-white text-[#C42945] text-center text-sm my-3 normal-case error-vibrate">{errors.email.message}</p>
            ) : (
              <></>
            )}
            <LoadingButton
              loading={loading}
              type="submit"
              className={`login-btn-gradient text-white tracking-wide outline-none focus:outline-none rounded ${loading ? "py-1" : "py-2"}`}
            >
              Continue
            </LoadingButton>
          </form>
        )}

        {codeSent && (
          <div className="bg-white p-5 w-[422px] flex flex-col mb-40">
            <h2 className="mb-4 text-2xl font-semibold">
              <GreenCheckIcon />
              Email Sent!
            </h2>
            <p className="mb-4 text-gray-500 text-sm">You should receive an email with the instruction to reset your password. Sometimes it will go to your spam folder.</p>
          </div>
        )}
        <footer className="absolute bottom-[27px] lowercase left-0 right-0 flex justify-between text-[#667085] items-center 2xl:px-16 container mx-auto">
          <p>2022 in ergo</p>
          <p>Contact: Support@ergobooking.com</p>
        </footer>
      </div>
    </div>
  );
}
