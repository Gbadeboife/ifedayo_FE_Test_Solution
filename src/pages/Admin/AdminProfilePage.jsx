import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { tokenExpireError, AuthContext } from "@/authContext";
import Icon from "@/components/Icons";
import { useNavigate } from "react-router";

let sdk = new MkdSDK();

const AdminProfilePage = () => {
  const schema = yup
    .object({
      email: yup.string().email().required(),
    })
    .required();

  const { dispatch, state } = React.useContext(AuthContext);
  const [oldEmail, setOldEmail] = useState("");
  const [userId, setUserId] = useState();
  const [profile, setProfile] = useState();
  const [edit, setEdit] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "profile",
      },
    });

    (async function () {
      try {
        const result = await sdk.getProfile();
        setProfile(result);
        setValue("email", result.email);
        setValue("first_name", result.first_name);
        setValue("last_name", result.last_name);
        setOldEmail(result.email);
      } catch (error) {
        console.log("Error", error);
        tokenExpireError(dispatch, error.message);
      }
    })();
  }, []);

  const onSubmit = async (data) => {
    try {
      sdk.setTable("user");
      await sdk.callRestAPI(
        {
          id: state.user,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
        },
        "PUT",
      );

      showToast(globalDispatch, "Profile updated Successfully");
      setProfile({ ...profile, first_name: data.first_name, last_name: data.last_name, email: data.email });
    } catch (error) {
      console.log("Error", error);
      setError("email", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(globalDispatch, error.message);
    }
  };

  const tabs = [
    {
      key: 0,
      name: "Profile",
      component: !edit ? (
        <ViewProfilePage
          profileInfo={profile}
          setEdit={setEdit}
        />
      ) : (
        <EditProfilePage
          register={register}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          errors={errors}
          setEdit={setEdit}
        />
      ),
    },
    {
      key: 1,
      name: "Password",
      component: <EditPasswordPage />,
    },
  ];

  return (
    <>
      <main>
        <div className=" rounded bg-white mx-auto ">
          <div className="border px-5 py-5">
            <div className="flex justify-between">
              <h4 className="text-2xl font-bold">Profile</h4>
            </div>
          </div>
          <div className="text-sm font-medium text-center text-gray-500 border-t-0 border-b border-r border-l border-gray-200">
            <ul className="flex flex-wrap -mb-px">
              {tabs.map((tab) => (
                <li
                  key={tab.key}
                  className="mr-2"
                >
                  <button
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-block p-4 ${
                      activeTab === tab.key ? "text-[#111827] border-[#111827] font-bold" : " border-transparent hover:text-gray-600 hover:border-gray-300"
                    }  rounded-t-lg border-b-2 `}
                  >
                    {tab.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {tabs[activeTab].component}
        </div>
      </main>
    </>
  );
};

const ViewProfilePage = ({ profileInfo, setEdit }) => {
  return (
    <div className="p-5">
      <div className="w-full max-w-[413px]">
        <div className="flex mb-5 px-5">
          <div className="flex-1">
            <button
              className="flex items-center bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text text-transparent"
              onClick={() => setEdit(true)}
            >
              <Icon
                type="pencil"
                className="stroke-[#33D4B7]"
              />
              <span className="ml-2">Edit</span>
            </button>
          </div>
        </div>
        <div className="flex py-2">
          <p className="w-[9rem] px-5 text-left mr-10">First name</p>
          <p className="flex-1">{profileInfo?.first_name}</p>
        </div>
        <div className="flex py-2">
          <p className="w-[9rem] px-5 text-left mr-10">Last name</p>
          <p className="flex-1">{profileInfo?.last_name}</p>
        </div>
        <div className="flex py-2">
          <p className="w-[9rem] px-5 text-left mr-10">Email</p>
          <p className="flex-1 normal-case">{profileInfo?.email}</p>
        </div>
      </div>
    </div>
  );
};

const EditProfilePage = ({ register, onSubmit, handleSubmit, errors, setEdit }) => {
  return (
    <div className="p-5 border-t-0 border">
      <div className="flex mb-5 px-5">
        <div className="flex-1">
          <button
            type="button"
            onClick={() => setEdit(false)}
            className="font-semibold text-sm pr-5 text-center inline-flex items-center mr-2 mb-2"
          >
            <Icon
              type="arrow"
              variant="narrow-left"
              className="stroke-[#667085] h-4 w-4"
            />{" "}
            <span className="ml-2">Back</span>
          </button>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-lg"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">First name</label>
          <input
            className="   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
            id="first_name"
            type="test"
            placeholder="First Name"
            name="first_name"
            {...register("first_name")}
          />
          <p className="text-red-500 text-xs italic">{errors.first_name?.message}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Last name</label>
          <input
            className="   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
            id="last_name"
            type="text"
            placeholder="Last name"
            name="last_name"
            {...register("last_name")}
          />
          <p className="text-red-500 text-xs italic">{errors.last_name?.message}</p>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            {...register("email")}
            name="email"
            className={"   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"}
            id="email"
            type="email"
            placeholder=""
          />
          <p className="text-red-500 text-xs italic">{errors.email?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            className="!bg-gradient-to-r flex-1 from-[#33D4B7] to-[#0D9895] font-semibold text-white  px-6 py-2 text-sm outline-none focus:outline-none mb-1 rounded"
          >
            Update Details
          </button>
        </div>
      </form>
    </div>
  );
};

const EditPasswordPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const schema = yup
    .object({
      current_password: yup.string().required(),
      new_password: yup.string().required(),
      confirm_password: yup.string().oneOf([yup.ref("new_password"), null], "Passwords must match"),
    })
    .required();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      if (data.new_password.length > 0 && data.current_password.length > 0) {
        const passwordresult = await sdk.updatePassword({
          currentPassword: data.current_password,
          password: data.new_password,
        });
        if (!passwordresult.error) {
          showToast(globalDispatch, "Password Updated", 2000);
        } else {
          if (passwordresult.validation) {
            const keys = Object.keys(passwordresult.validation);
            for (let i = 0; i < keys.length; i++) {
              const field = keys[i];
              setError(field, {
                type: "manual",
                message: passwordresult.validation[field],
              });
            }
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
  return (
    <div className="p-5 border-t-0 border">
      <p className="text-[#667085] text-sm mb-4">Enter your current password to change your password.</p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-sm"
      >
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Current Password</label>
          <input
            className="   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
            id="current_password"
            type="current_password"
            placeholder="Current Password"
            name="current_password"
            {...register("current_password")}
          />
          <p className="text-red-500 text-xs italic">{errors.current_password?.message}</p>
        </div>
        <div className="h-[1px] mb-6 border border-b-0 border-[#EAECF0]"></div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
          <input
            {...register("new_password")}
            name="new_password"
            className={"   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"}
            id="new_password"
            type="password"
            placeholder="New Password"
          />
          <p className="text-red-500 text-xs italic">{errors.new_password?.message}</p>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
          <input
            {...register("confirm_password")}
            name="confirm_password"
            className={"   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"}
            id="confirm_password"
            type="password"
            placeholder="Confirm Password"
          />
          <p className="text-red-500 text-xs italic">{errors.confirm_password?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            className="!bg-gradient-to-r flex-1 from-[#33D4B7] to-[#0D9895] font-semibold text-white  px-6 py-2 text-sm outline-none focus:outline-none mb-1 rounded"
          >
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfilePage;
