import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";
import SmartSearch from "@/components/SmartSearch";
import TreeSDK from "@/utils/TreeSDK";

const treeSdk = new TreeSDK();
const AddAdminPropertyAddOnPage = () => {
  const [selectedProperty, setSelectedProperty] = useState({});
  const [properties, setPropertyData] = useState([]);

  async function getPropertyData(pageNum, limitNum, data) {
    try {
      let filter = ["deleted_at,is"];
      if (data.name) {
        filter.push(`name,cs,${data.name}`);
      }
      const result = await treeSdk.getList("property", { join: [], filter });
      const { list } = result;
      setPropertyData(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  let sdk = new MkdSDK();
  const [addOns, setAddOns] = React.useState([]);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const schema = yup
    .object({
      property_id: yup.string(),
      add_on_id: yup.number("Please select an Add on").required().positive().integer().typeError("Please select an Add on"),
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
  async function confirmPropertyID(data) {
    try {
      sdk.setTable("property");
      const result = await sdk.callRestAPI(
        {
          id: data.property_id,
        },
        "GET",
      );
      if (!result.error && result?.model) {
        onSubmit(data);
      } else {
        setError("property_id", {
          type: "manual",
          message: "Property with this ID doesn't exist",
        });
      }
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  const getAllAddOns = async () => {
    try {
      sdk.setTable("add_on");
      const result = await sdk.callRestAPI({}, "GETALL");
      if (!result.error) {
        setAddOns(result.list);
      }
    } catch (error) {
      console.log("Error", error);
      setError("add_on_id", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedProperty?.id) {
      setError("property_id", "Property Name is Required");
      return;
    }
    data.property_id = selectedProperty.id;
    try {
      sdk.setTable("property_add_on");

      const result = await sdk.callRestAPI(
        {
          property_id: data.property_id,
          add_on_id: data.add_on_id,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/property_add_on");
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
      setError("property_id", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  const onError = () => {
    if (!selectedProperty?.id) {
      setError("property_id", {
        type: "manual",
        message: "Please select a property",
      });
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_add_on",
      },
    });
    (async function () {
      await getPropertyData();
      await getAllAddOns();
    })();
  }, []);

  return (
    <AddAdminPageLayout
      title={"Property Add-on"}
      backTo={"property_add_on"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="property_id"
          >
            Property
          </label>
          <SmartSearch
            selectedData={selectedProperty}
            setSelectedData={setSelectedProperty}
            data={properties}
            getData={getPropertyData}
            field="name"
            errorField="property_id"
            setError={setError}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.property_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="add_on_id"
          >
            Add-Ons
          </label>
          <select
            className="mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            {...register("add_on_id")}
            defaultValue="none"
          >
            <option value="none">Select Option</option>
            {addOns.map((option) => (
              <option
                name="add_on_id"
                value={option.id}
                key={option.id}
              >
                {option?.name}
              </option>
            ))}
          </select>
          <p className="text-xs normal-case italic text-red-500">{errors.add_on_id?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/property_add_on")}
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

export default AddAdminPropertyAddOnPage;
