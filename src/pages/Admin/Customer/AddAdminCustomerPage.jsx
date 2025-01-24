import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { tokenExpireError, AuthContext } from "@/authContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";
import moment from "moment";
import commonPasswords from "@/assets/json/common-passwords.json";

const AddAdminCustomerPage = () => {
  const schema = yup.object({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    email: yup.string().email().required("Email is required"),
    dob: yup
      .string()
      .test("is-not-in-future", "Not a valid date", (val) => {
        console.log("testing here", val);
        if (val == "") return true;
        const date = new Date(val);
        return date < new Date();
      })
      .test("must-be-at-least-18yo", "Must be at least 18 years of age", (val) => {
        return moment().diff(moment(val), "years") > 18;
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
        return commonPasswords.every((pass) => !val.includes(pass));
      })
      .test("does-not-contain-user-info", "Password must not contain your name or date of birth", (val, ctx) => {
        const d = moment(ctx.parent.dob);
        return [ctx.parent.firstName, ctx.parent.lastName, d.format("yyyyMMDD"), d.format("DDMMyyyy"), d.format("MMDDyyyy"), d.format("YYMMDD"), d.format("MMDDYY"), d.format("DDMMYY")].every(
          (field) => field.trim() == "" || !val.toLowerCase().includes(field.toLowerCase()),
        );
      }),
    role: yup.string().required(),
    status: yup.string().required(),
    verify: yup.string().required(),
  });

  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    trigger,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { password: "" },
    criteriaMode: "all",
    mode: "all",
  });

  const onSubmit = async (data) => {
    console.log("submitting", data);
    let sdk = new MkdSDK();
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/register",
        {
          firstName: data.firstName,
          lastName: data.lastName,
          status: data.status || 0,
          email: data.email,
          password: data.password,
          dob: data.dob || null,
          verify: data.verify || 0,
          role: "customer",
          payment_method_set: 0,
        },
        "POST",
      );

      if (!result.error) {
        showToast(dispatch, "Added");
        navigate("/admin/customer");
      } else {
        if (result?.validation) {
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

      // register device
      sdk.setTable("device");
      await sdk.callRestAPI({ active: 1, user_id: result.user_id, last_login_time: new Date().toISOString().split("T")[0], uid: localStorage.getItem("device-uid") }, "POST");
    } catch (error) {
      setError("firstName", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "customer",
      },
    });
  }, []);

  function getPasswordErrors() {
    var arr = [];
    if (Array.isArray(errors.password?.types.matches)) {
      arr = [...errors.password.types.matches];
    }
    if (typeof errors.password?.types?.matches === "string") {
      arr.push(errors.password.types.matches);
    }
    if (errors.password?.types?.min) {
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
    <AddAdminPageLayout
      title={"Customer"}
      backTo={"customer"}
    >
      <div className="border-t-0 p-5">
        <form
          className=" w-full max-w-sm"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <div className="mb-4 ">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="firstName"
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              {...register("firstName")}
              className={`" w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none${errors.firstName?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs normal-case italic text-red-500 ">{errors.firstName?.message}</p>
          </div>
          <div className="mb-4 ">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="lastName"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              {...register("lastName")}
              className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.lastName?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs normal-case italic text-red-500">{errors.lastName?.message}</p>
          </div>
          <div className="mb-4 ">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register("email")}
              autoComplete="off"
              className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.email?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs normal-case italic text-red-500">{errors.email?.message}</p>
          </div>
          <div className="mb-4 ">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="dob"
            >
              Date Of Birth
            </label>
            <input
              type="date"
              id="dob"
              min="1950-01-01"
              {...register("dob")}
              className={`" w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.dob?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs normal-case italic text-red-500">{errors.dob?.message}</p>
          </div>
          <div className="mb-5">
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-bold text-gray-700"
            >
              Role
            </label>
            <select
              name="role"
              id="role"
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 capitalize leading-tight text-gray-700 focus:outline-none"
              {...register("role")}
            >
              {["customer"].map((role) => (
                <option
                  value={role}
                  key={role}
                >
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-bold text-gray-700"
            >
              Status
            </label>
            <select
              name="status"
              id="status"
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("status")}
            >
              {["Inactive", "Active"].map((option, idx) => (
                <option
                  value={idx}
                  key={idx}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label
              htmlFor="verify"
              className="mb-2 block text-sm font-bold text-gray-700"
            >
              Verified
            </label>
            <select
              name="verify"
              id="verify"
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("verify")}
              defaultValue={0}
            >
              {["No", "Yes"].map((option, idx) => (
                <option
                  value={idx}
                  key={idx}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password", {
                onChange: () => {
                  trigger("password");
                },
              })}
              autoComplete="new-password"
              className={` mb-3  w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.password?.message ? "border-red-500" : ""}`}
            />
            {dirtyFields.password && (
              <div className="fade-in mb-4 space-y-2 rounded-sm border border-[#C42945] p-3 text-sm normal-case text-[#C42945] empty:hidden">
                {passwordErrors.map((msg, idx) => (
                  <p key={idx}>{msg}</p>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => navigate("/admin/customer")}
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
      </div>
    </AddAdminPageLayout>
  );
};

export default AddAdminCustomerPage;
