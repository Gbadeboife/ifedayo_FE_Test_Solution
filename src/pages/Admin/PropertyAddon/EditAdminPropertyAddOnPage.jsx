import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import EditAdminPageLayout from "@/layouts/EditAdminPageLayout";
import SmartSearch from "@/components/SmartSearch";

let sdk = new MkdSDK();

const EditAdminPropertyAddOnPage = () => {
  const [selectedProperty, setSelectedProperty] = useState({});
  const [properties, setPropertyData] = useState([]);

  async function getPropertyData(pageNum, limitNum, data) {
    try {
      sdk.setTable("property");
      const payload = { name: data.name || undefined };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limitNum,
        },
        "PAGINATE",
      );
      const { list } = result;
      setPropertyData(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  const { dispatch } = React.useContext(AuthContext);
  const schema = yup
    .object({
      property_id: yup.string(),
      add_on_id: yup.number().required().positive().integer(),
    })
    .required();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [addOns, setAddOns] = React.useState([]);
  const navigate = useNavigate();
  const [id, setId] = useState(0);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const params = useParams();

  useEffect(function () {
    (async function () {
      await getPropertyData(1, 0, { name: null });
    })();
  }, []);

  useEffect(() => {
    // this effect should only be called once
    if (addOns.length > 0 && properties.length > 0 && !selectedProperty.name) {
      (async function () {
        try {
          sdk.setTable("property_add_on");
          const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
          if (!result.error) {
            // setValue("property_id", result.model.property_id);
            setSelectedProperty(properties.find((prop) => prop.id == result.model.property_id) || { name: "" });
            setValue("add_on_id", result.model.add_on_id);
            setId(result.model.id);
          }
        } catch (error) {
          console.log("error", error);
          tokenExpireError(dispatch, error.message);
        }
      })();
    }
  }, [addOns.length, properties.length]);

  const onSubmit = async (data) => {
    if (!selectedProperty?.id) {
      setError("property_id", "Property Name is Required");
      return;
    }
    data.property_spaces_id = selectedProperty.id;
    sdk.setTable("property_add_on");
    try {
      const result = await sdk.callRestAPI(
        {
          id: id,
          property_id: data.property_spaces_id,
          add_on_id: data.add_on_id,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
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
      setError("property_spaces_id", {
        type: "manual",
        message: error.message,
      });
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

  useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_add_on",
      },
    });
    (async function () {
      await getPropertyData(1, 10, { name: "" });
      await getAllAddOns();
    })();
  }, []);

  return (
    <EditAdminPageLayout
      title="Property Add on"
      backTo="property_add_on"
      showDelete={false}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
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

          <p className="text-red-500 text-xs italic normal-case">{errors.property_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="add_on_id"
          >
            Add-Ons
          </label>
          <select
            className="border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
            {...register("add_on_id")}
          >
            <option
              selected
              value="none"
              hidden
            >
              Select Option
            </option>
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
          <p className="text-red-500 text-xs italic normal-case">{errors.add_on_id?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/property_add_on")}
            className="!bg-gradient-to-r flex-1 text-[#667085] font-semibold border border-[#667085] px-6 py-2 text-sm outline-none focus:outline-none mb-1 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="!bg-gradient-to-r flex-1 from-[#33D4B7] to-[#0D9895] font-semibold text-white  px-6 py-2 text-sm outline-none focus:outline-none ml-5 mb-1 rounded"
          >
            Save
          </button>
        </div>
      </form>
    </EditAdminPageLayout>
  );
};

export default EditAdminPropertyAddOnPage;
