import NextIcon from "@/components/frontend/icons/NextIcon";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUpContext } from "./signUpContext";

export default function SignUpSelectRole() {
  const { dispatch } = useSignUpContext();
  const navigate = useNavigate();

  function selectHost() {
    dispatch({ type: "SET_ROLE", payload: "host" });
    navigate("/signup");
  }

  function selectCustomer() {
    dispatch({ type: "SET_ROLE", payload: "customer" });
    navigate("/signup");
  }

  return (
    <>
      <div className="w-full flex items-center justify-center normal-case">
        <div className="max-w-3xl mx-auto w-full text-center mb-40">
          <h1 className="text-5xl font-semibold mb-4">Sign Up</h1>
          <p>Select an option below</p>
          <br />
          <hr />
          <br />
          <div className="flex flex-col gap-12 items-center">
            <button
              className="py-4 px-4 shadow-sm w-full max-w-sm hover:shadow-lg duration-200 border rounded-xl hover:ring-2 ring-[#0d9895] focus:outline-none focus:ring-2"
              onClick={selectHost}
            >
              <span className="span flex justify-between items-center mb-4">
                <span className="font-semibold text-2xl">Sign up as host</span>
                <span className="">
                  <NextIcon />
                </span>
              </span>
            </button>
            <button
              className="py-4 px-4 shadow-sm w-full max-w-sm hover:shadow-lg duration-200 border rounded-xl hover:ring-2 ring-[#0d9895] focus:outline-none focus:ring-2"
              onClick={selectCustomer}
            >
              <span className="span flex justify-between items-center mb-4">
                <span className="font-semibold text-2xl">Sign up as customer</span>
                <span className="">
                  <NextIcon />
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
