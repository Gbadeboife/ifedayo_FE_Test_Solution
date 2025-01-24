import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";

const AddAdminAddOnPage = () => {
  let sdk = new MkdSDK();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [spaceCategories, setSpaceCategories] = React.useState([]);
  const schema = yup
    .object({
      name: yup.string().required("Name is required"),
      cost: yup.number().required().typeError("Cost must be a number"),
      space_id: yup.number().required().typeError("This field is required"),
    })
    .required();

  const { dispatch } = React.useContext(AuthContext);

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  async function fetchSpaceCategories() {
    try {
      sdk.setTable("spaces");
      const result = await sdk.callRestAPI({}, "GETALL");
      if (Array.isArray(result.list)) {
        setSpaceCategories(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  const onSubmit = async (data) => {
    try {
      sdk.setTable("add_on");

      const result = await sdk.callRestAPI(
        {
          name: data.name,
          cost: data.cost,
          space_id: data.space_id || null,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/add_on");
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
      setError("name", {
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
        path: "add_on",
      },
    });
    fetchSpaceCategories();
  }, []);

  return (
    <AddAdminPageLayout
      title={"Add-on"}
      backTo={"add_on"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="name"
          >
            Name
          </label>
          <input
            placeholder="Name"
            {...register("name")}
            className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.name?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.name?.message}</p>
        </div>
        <div className="mb-4">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="space_id"
          >
            Space Category
          </label>
          <select
            {...register("space_id")}
            className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none ${
              errors.space_id?.message ? "border-red-500" : ""
            }`}
          >
            <option value="">NONE</option>
            {spaceCategories.map((ctg) => (
              <option
                key={ctg.id}
                value={ctg.id}
              >
                {ctg.category}
              </option>
            ))}
          </select>
          <p className="text-xs italic text-red-500">{errors.space_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="cost"
          >
            Cost
          </label>
          <input
            type="number"
            placeholder="cost"
            {...register("cost")}
            className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.cost?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.cost?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/add_on")}
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
    </AddAdminPageLayout>
  );
};

export default AddAdminAddOnPage;
