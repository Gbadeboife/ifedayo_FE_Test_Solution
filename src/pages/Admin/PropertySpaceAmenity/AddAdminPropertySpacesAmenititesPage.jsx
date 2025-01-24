import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";
import SmartSearch from "@/components/SmartSearch";

const AddAdminPropertySpacesAmenititesPage = () => {
  let sdk = new MkdSDK();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [selectedSpace, setSelectedSpace] = React.useState();
  const [propertySpaces, setPropertySpaces] = React.useState([]);
  const [amenities, setAmenities] = React.useState([]);
  const schema = yup
    .object({
      property_spaces_id: yup.string(),
      amenity_id: yup.number().required().positive().integer().typeError("Please select an amenity"),
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

  async function getPropertySpacesData(pageNum, limit, data) {
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-spaces/PAGINATE",
        {
          where: [data?.property_name ? `ergo_property.name LIKE '%${data.property_name}%' OR ergo_spaces.category LIKE '%${data.property_name}%'` : 1],
          page: pageNum,
          limit: limit,
        },
        "POST",
      );
      const { list } = result;
      setPropertySpaces(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  const getAllAmenities = async () => {
    try {
      sdk.setTable("amenity");
      const result = await sdk.callRestAPI({}, "GETALL");
      if (!result.error) {
        setAmenities(result.list);
      }
    } catch (error) {
      console.log("Error", error);
      setError("amenity_id", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  const onSubmit = async (data) => {
    if (selectedSpace?.id) {
      data.property_spaces_id = selectedSpace.id;
      try {
        sdk.setTable("property_spaces_amenitites");
        const result = await sdk.callRestAPI(
          {
            property_spaces_id: data.property_spaces_id,
            amenity_id: data.amenity_id,
          },
          "POST",
        );
        if (!result.error) {
          showToast(globalDispatch, "Added");
          navigate("/admin/property_spaces_amenitites");
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
        tokenExpireError(dispatch, error.message);
      }
    } else {
      setError("property_spaces_id", {
        type: "manual",
        message: "Please Select a property space",
      });
    }
  };

  const onError = () => {
    if (!selectedSpace?.id) {
      setError("property_spaces_id", {
        type: "manual",
        message: "Please Select a property space",
      });
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces_amenitites",
      },
    });
    getAllAmenities();
  }, []);

  return (
    <AddAdminPageLayout
      title={"Property Space Amenity"}
      backTo={"property_spaces_amenitites"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_spaces_id"
          >
            Property Space
          </label>
          <SmartSearch
            selectedData={selectedSpace}
            setSelectedData={setSelectedSpace}
            data={propertySpaces}
            getData={getPropertySpacesData}
            field="property_name"
            field2="space_category"
            errorField="property_spaces_id"
            setError={setError}
          />
          <p className="text-red-500 text-xs italic">{errors.property_spaces_id?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="amenity_id"
          >
            Amenity
          </label>
          <select
            className="border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
            {...register("amenity_id")}
          >
            <option
              selected
              value="none"
              hidden
            >
              Select Option
            </option>
            {amenities.map((option) => (
              <option
                name="property_spaces_id"
                value={option.id}
                key={option.id}
              >
                {option?.name}
              </option>
            ))}
          </select>
          <p className="text-red-500 text-xs italic">{errors.amenity_id?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/property_spaces_amenitites")}
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
    </AddAdminPageLayout>
  );
};

export default AddAdminPropertySpacesAmenititesPage;
