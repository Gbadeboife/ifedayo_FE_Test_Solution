import { LoadingButton } from "@/components/frontend";
import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { Dialog, Transition } from "@headlessui/react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { Fragment } from "react";
import { useState } from "react";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import commonPasswords from "@/assets/json/common-passwords.json";
import moment from "moment";

export default function EditPasswordModal({ modalOpen, closeModal }) {
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const schema = yup.object({
    current_password: yup.string().required("This field is required"),
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
        const d = moment(globalState.user.dob);
        return [
          globalState.user.first_name,
          globalState.user.last_name,
          d.format("yyyyMMDD"),
          d.format("DDMMyyyy"),
          d.format("MMDDyyyy"),
          d.format("YYMMDD"),
          d.format("MMDDYY"),
          d.format("DDMMYY"),
        ].every((field) => field.trim() == "" || !val.toLowerCase().includes(field.toLowerCase()));
      }),
    confirm_password: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords don't match")
      .required("This field is required"),
  });

  const {
    handleSubmit,
    register,
    reset,
    trigger,
    formState: { errors, dirtyFields },
  } = useForm({ defaultValues: { current_password: "", password: "", confirm_password: "" }, resolver: yupResolver(schema), criteriaMode: "all" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(data) {
    console.log("submitting", data);
    setLoading(true);
    try {
      await callCustomAPI(
        "edit-self",
        "post",
        {
          user: { password: data.password, oldPassword: data.current_password },
        },
        "",
      );
      closeModal();
      reset();
      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: {
          heading: "Success",
          message: "Password change successful",
          btn: "Ok got it",
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
    <>
      <Transition
        appear
        show={modalOpen}
        as={Fragment}
      >
        <Dialog
          as="div"
          className="relative z-10"
          onClose={closeModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  as="form"
                  className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="mb-[18px] flex items-center justify-between">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-semibold"
                    >
                      Change Password
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-full border p-1 px-3 text-2xl font-normal duration-300 hover:bg-gray-200"
                    >
                      &#x2715;
                    </button>{" "}
                  </div>
                  <hr className="mb-4" />

                  <p className="mb-4">In order to set new password provide the current one:</p>

                  <div className="mb-8">
                    <div className="relative flex justify-between rounded-sm border bg-transparent">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        {...register("current_password")}
                        className="flex-grow border-0 p-2 px-4 focus:outline-none active:outline-none "
                        placeholder="Type current password"
                      />{" "}
                      <button
                        type="button"
                        onClick={() => setShowOldPassword((prev) => !prev)}
                        className="absolute right-1 top-[20%]"
                      >
                        {" "}
                        {showOldPassword ? (
                          <img
                            src="/show.png"
                            alt=""
                            className="mr-2 ml-2 w-6"
                          />
                        ) : (
                          <img
                            src="/invisible.png"
                            alt=""
                            className="mr-2 ml-2 w-6"
                          />
                        )}
                      </button>
                    </div>
                  </div>
                  <hr className="my-[32px] md:my-[32px]" />
                  <div className="mb-8">
                    <div className="relative mb-4 flex justify-between rounded-sm border bg-transparent">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("password", {
                          onChange: (e) => {
                            trigger("password");
                          },
                        })}
                        className="flex-grow border-0 p-2 px-4 focus:outline-none active:outline-none "
                        placeholder="Type new password"
                        autoComplete="new-password"
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
                            className="mr-2 ml-2 w-6"
                          />
                        ) : (
                          <img
                            src="/invisible.png"
                            alt=""
                            className="mr-2 ml-2 w-6"
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
                  </div>
                  <div className="mb-4">
                    <div className="relative flex justify-between rounded-sm border bg-transparent">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        {...register("confirm_password")}
                        className="flex-grow border-0 p-2 px-4 focus:outline-none active:outline-none "
                        placeholder="Retype new password"
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
                            className="mr-2 ml-2 w-6"
                          />
                        ) : (
                          <img
                            src="/invisible.png"
                            alt=""
                            className="mr-2 ml-2 w-6"
                          />
                        )}
                      </button>
                    </div>
                    {Object.entries(errors).length > 0 && dirtyFields.password && !errors.password ? (
                      <p className="error-vibrate my-3 rounded-md border border-[#C42945] bg-white py-2 px-3 text-center text-sm normal-case text-[#C42945]">{Object.values(errors)[0].message}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="mt-4 flex-grow rounded border-2 border-[#98A2B3] py-2 tracking-wide outline-none focus:outline-none"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <LoadingButton
                      loading={loading}
                      type="submit"
                      className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "py-1 px-4" : "py-2"} mt-4 flex-grow`}
                    >
                      Update
                    </LoadingButton>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
