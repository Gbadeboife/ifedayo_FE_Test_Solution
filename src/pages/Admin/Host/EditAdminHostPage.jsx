import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import moment from "moment";

let sdk = new MkdSDK();

const EditAdminHostPage = () => {
  const schema = yup
    .object({
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      email: yup.string().email().required(),
      password: yup.string(),
      status: yup.string(),
      dob: yup.string(),
      role: yup.string(),
      verify: yup.string(),
    })
    .required();

  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch, state } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const params = useParams();
  const buttonRef = useRef(null);
  const [oldEmail, setOldEmail] = useState("");
  const [oldFirstName, setOldFirstName] = useState("");
  const [oldLastName, setOldLastName] = useState("");
  const [id, setId] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const selectRole = [
    // { name: "role", value: "Admin" },
    { name: "role", value: "Host" },
    // { name: "role", value: "Customer" }
  ];
  const selectStatus = [
    { key: "0", value: "Inactive" },
    { key: "1", value: "Active" },
  ];

  const verify = [
    { key: "0", value: "No" },
    { key: "1", value: "Yes" },
  ];

  const onSubmit = async (data) => {
    console.log("submitting", data);
    try {
      if (oldEmail !== data.email) {
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
        navigate("/admin/host");
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

  React.useEffect(() => {
    if (state.saveChanges) {
      buttonRef.current.click();
      globalDispatch({
        type: "SAVE_CHANGES",
        payload: {
          saveChanges: false,
        },
      });
    }
  }, [state.saveChanges]);

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "host",
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
          setValue("role", result.model.role[0].toUpperCase() + result.model.role.slice(1));
          setValue("dob", !profile?.dob ? null : moment(profile.dob).format("yyyy-MM-DD"));
          setValue("status", result.model.status);
          setOldEmail(result.model.email);
          setValue("verify", result.model.verify);
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
    <form
      className=" mt-10 w-full max-w-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-5 flex justify-between">
        <p className="text-base font-bold">Edit Host</p>
        <button onClick={() => navigate(`/admin/view-host/${params?.id}`)}>Cancel</button>
      </div>
      <div className="mb-4 flex justify-between ">
        <p>ID</p>
        <p className="font-bold">{id}</p>
      </div>
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
          className={`"   w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none${false ? "border-red-500" : ""}`}
        />
        <p className="text-xs italic text-red-500">{false}</p>
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
          className={`"   w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${false ? "border-red-500" : ""}`}
        />
        <p className="text-xs italic text-red-500">{false}</p>
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
          className={`"   w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${false ? "border-red-500" : ""}`}
        />
        <p className="text-xs italic text-red-500">{false}</p>
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
          className="   mb-3  w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
          {...register("role")}
        >
          {selectRole.map((option) => (
            <option
              name={option.name}
              value={option.value}
              key={option.value}
            >
              {option.value}
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
          className="   mb-3  w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
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
          className=" mb-3  w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
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
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => navigate("/admin/host")}
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
  );
};

export default EditAdminHostPage;
