import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import EditAdminPageLayout from "@/layouts/EditAdminPageLayout";
import moment from "moment";

let sdk = new MkdSDK();

const EditAdminUserPage = () => {
  const schema = yup
    .object({
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      email: yup.string().email().required(),
      password: yup.string(),
      status: yup.string(),
      dob: yup.string().nullable(),
      role: yup.string(),
      verify: yup.string(),
    })
    .required();

  const { dispatch, state: authState } = React.useContext(AuthContext);
  const { dispatch: globalDispatch, state } = React.useContext(GlobalContext);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const params = useParams();
  const [oldEmail, setOldEmail] = useState("");
  const [oldFirstName, setOldFirstName] = useState("");
  const [oldLastName, setOldLastName] = useState("");
  const [id, setId] = useState(0);

  const {
    trigger,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const selectStatus = [
    { key: "0", value: "Inactive" },
    { key: "1", value: "Active" },
  ];

  const verify = [
    { key: "0", value: "No" },
    { key: "1", value: "Yes" },
  ];

  const onSubmit = async (data) => {
    console.log("got here", data);
    try {
      if (oldEmail !== data.email) {
        console.log("here", oldEmail, data.email);
        const emailresult = await sdk.updateEmailByAdmin(data.email, id);
        if (!emailresult.error) {
          showToast(globalDispatch, "Email Updated", 1000);
        } else {
          if (emailresult.validation) {
            const keys = Object.keys(emailresult.validation);
            for (let i = 0; i < keys.length; i++) {
              const field = keys[i];
              setError(field, {
                type: "manual",
                message: emailresult.validation[field],
              });
            }
          }
        }
      }

      sdk.setTable("user");
      const result = await sdk.callRestAPI(
        {
          id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          role: data.role.toLowerCase(),
          status: data.status,
          verify: data.verify || 0,
        },
        "PUT",
      );
      sdk.setTable("profile");
      const resultDob = await sdk.callRestAPI({ set: { dob: data.dob }, where: { user_id: id } }, "PUTWHERE"); // Note: Ideally it should be user_id but existing sdk only supports updating by id

      if (resultDob.error) {
        setError("dob", {
          type: "manual",
          message: "Date of birth is required",
        });
      } else if (!result.error) {
        showToast(globalDispatch, "Updated", 4000);
        navigate("/admin/user");
      } else {
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
    } catch (error) {
      console.log("Error", error);
      setError("email", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  useEffect(() => {
    if (state.saveChanges) {
      // check form then submit if all good
      console.log("triggering");
      trigger().then((res) => {
        if (res) {
          handleSubmit(onSubmit)();
        }
      });

      globalDispatch({
        type: "SAVE_CHANGES",
        payload: {
          saveChanges: false,
        },
      });
    }
  }, [state.saveChanges]);

  useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "user",
      },
    });

    (async function () {
      try {
        sdk.setTable("user");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");

        sdk.setTable("profile");
        const {
          list: [profile],
        } = await sdk.callRestAPI({ payload: { user_id: result.model.id } }, "GETALL");

        if (!result.error) {
          setValue("firstName", result.model.first_name);
          setValue("lastName", result.model.last_name);
          setValue("email", result.model.email);
          setValue("role", result.model.role);
          setValue("dob", !profile?.dob ? null : moment(profile.dob).format("yyyy-MM-DD"));
          setValue("status", result.model.status);
          setValue("verify", result.model.verify);
          setOldEmail(result.model.email);
          setOldFirstName(result.model.first_name);
          setOldLastName(result.model.last_name);
          setId(result.model.id);
        }
      } catch (error) {
        console.log("Error", error);
        tokenExpireError(dispatch, error.message);
      }
    })();
  }, []);
  return (
    <EditAdminPageLayout
      title="User"
      backTo="user"
      table1="user"
      table2="profile"
      deleteMessage="Are you sure you want to delete this User?"
      id={id}
    >
      <form
        className=" w-full max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="firstName"
          >
            First name
          </label>
          <input
            id="firstName"
            type="text"
            {...register("firstName")}
            className={`"   w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none${errors.firstName?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs italic text-red-500">{errors.firstName?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="lastName"
          >
            Last name
          </label>
          <input
            type="text"
            id="lastName"
            {...register("lastName")}
            className={`"   w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.lastName?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs italic text-red-500">{errors.lastName?.message}</p>
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
            className={`"   w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.email?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs italic text-red-500">{errors.email?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="dob"
          >
            Date of birth
          </label>
          <input
            type="date"
            id="dob"
            {...register("dob")}
            className={`"   w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.dob?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs italic text-red-500">{errors.dob?.message}</p>
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
            className="mb-3 w-full rounded border bg-white py-2 px-3 capitalize leading-tight text-gray-700 focus:outline-none"
            {...register("role")}
          >
            {(authState.originalRole == "superadmin" ? ["superadmin", "admin", "host", "customer"] : ["admin", "host", "customer"]).map((option) => (
              <option
                value={option}
                key={option}
              >
                {option}
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
            className="mb-3 w-full  rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            {...register("status")}
          >
            {selectStatus.map((option) => (
              <option
                name="status"
                value={option.key}
                key={option.key}
              >
                {option.value}
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
            className="mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            {...register("verify")}
            defaultValue={0}
          >
            {verify.map((option) => (
              <option
                name="verify"
                value={option.key}
                key={option.key}
              >
                {option.value}
              </option>
            ))}
          </select>
        </div>
        {/* <div className="mb-5">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className={`   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none ${errors.password?.message ? "border-red-500" : ""
              }`}
          />
          <p className="text-red-500 text-xs italic">
            {errors.password?.message}
          </p>
        </div> */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/user")}
            className="mb-1 flex-1 rounded border border-[#667085] !bg-gradient-to-r px-6 py-2 text-sm font-semibold text-[#667085] outline-none focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              globalDispatch({
                type: "SHOWMODAL",
                payload: {
                  showModal: true,
                  modalShowTitle: "Confirm Changes",
                  type: "Edit",
                  modalShowMessage: `Are you sure you want to update ${oldFirstName ? oldFirstName : ""}${oldLastName ? " " + oldLastName : ""}'s profile?`,
                  modalBtnText: "Yes, save changes",
                },
              })
            }
            className="ml-5 mb-1 flex-1 rounded !bg-gradient-to-r from-[#33D4B7]  to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
          >
            Save
          </button>
          <button
            ref={buttonRef}
            type="submit"
            className="hidden"
          ></button>
        </div>
      </form>
    </EditAdminPageLayout>
  );
};

export default EditAdminUserPage;
