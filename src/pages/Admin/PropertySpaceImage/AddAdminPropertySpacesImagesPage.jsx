import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";

const AddAdminPropertySpacesImagesPage = () => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [file, setFile] = React.useState();
  const [propertyId, setPropertyId] = React.useState("");
  const [spaces, setSpaces] = React.useState([]);
  let sdk = new MkdSDK();
  const schema = yup
    .object({
      property_id: yup.number().required("Property Id is required").typeError("Property ID must be a number"),
      property_spaces_id: yup.number().required().positive().integer().typeError("No property selected"),
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

  const handleFileUpload = async (data) => {
    if (file) {
      const formData = new FormData();
      for (let i = 0; i < file.length; i++) {
        formData.append("file", file[i]);
      }
      try {
        const upload = await sdk.uploadImage(formData);
        data.image = upload.id;
        onSubmit(data);
      } catch (err) {
        globalDispatch({
          type: "SHOW_ERROR",
          payload: {
            heading: "Operation failed",
            message: err.message,
          },
        });
      }
    } else {
      setError("image", {
        type: "manual",
        message: "Please include an image",
      });
    }
  };

  const getPropertySpaces = async (propertyId) => {
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-spaces/PAGINATE",
        {
          where: [propertyId ? `ergo_property.id = ${propertyId}` : 1],
          page: 1,
          limit: 10,
        },
        "POST",
      );
      if (!result.error && result?.list) {
        setSpaces(result.list);
      } else {
        setError("property_id", {
          type: "manual",
          message: "Property with this ID doesn't exist",
        });
      }
    } catch (error) {
      console.log("Error", error);
      setError("property_spaces_id", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  async function confirmPropertyID(propertyId) {
    try {
      sdk.setTable("property");
      const result = await sdk.callRestAPI(
        {
          id: propertyId,
        },
        "GET",
      );
      if (!result.error && result?.model) {
        setError("property_id", {
          type: "manual",
          message: "",
        });
        getPropertySpaces(propertyId);
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

  const onSubmit = async (data) => {
    console.log("got here");
    try {
      sdk.setTable("property_spaces_images");
      const result = await sdk.callRestAPI(
        {
          property_id: propertyId,
          property_spaces_id: data.property_spaces_id,
          photo_id: data.image,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/property_spaces_images");
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
    if (!file) {
      setError("image", {
        type: "manual",
        message: "Please include an image",
      });
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces_images",
      },
    });
  }, []);

  return (
    <AddAdminPageLayout
      title={"Property Space Images"}
      backTo={"property_spaces_images"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(handleFileUpload, onError)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_id"
          >
            Property ID
          </label>
          <input
            {...register("property_id")}
            placeholder="Property ID"
            value={propertyId}
            onChange={(event) => {
              setPropertyId(event.target.value);
              confirmPropertyID(event.target.value);
            }}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.property_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.property_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_spaces_id"
          >
            Property Space
          </label>
          <select
            className="border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
            {...register("property_spaces_id")}
          >
            <option
              selected
              value="none"
              hidden
            >
              Select Option
            </option>
            {spaces.map((option) => (
              <option
                name="property_spaces_id"
                value={option.id}
                key={option.id}
              >
                {option?.property_name} - {option?.space_category}
              </option>
            ))}
          </select>
          <p className="text-red-500 text-xs italic normal-case">{errors.property_spaces_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="image"
          >
            Image
          </label>
          <input
            className="block w-full text-sm py-2 px-3 text-gray-700 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none"
            type="file"
            accept="image/png, image/gif, image/jpeg"
            name="file"
            onChange={(e) => {
              setFile(e.target.files);
            }}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.image?.message}</p>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/property_spaces_images")}
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

export default AddAdminPropertySpacesImagesPage;
