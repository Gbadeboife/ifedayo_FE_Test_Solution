import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";
import SmartSearchV2 from "@/components/SmartSearchV2";

const AddAdminPropertyPage = () => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [selectedHost, setSelectedHost] = React.useState({});
  const [hosts, setHosts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  let sdk = new MkdSDK();
  const schema = yup
    .object({
      address_line_1: yup.string().required("Address line one is required"),
      address_line_2: yup.string("Address line 2 is required"),
      city: yup.string().required("City is required"),
      country: yup.string().required("Country is required"),
      zip: yup.number().required("Zip is required").typeError("Zip code must be a number"),
      name: yup.string().required("Name is required"),
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

  async function fetchHosts() {
    try {
      sdk.setTable("user");
      const result = await sdk.callRestAPI({}, "GETALL");
      const { list } = result;
      setHosts(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  const onSubmit = async (data) => {
    setLoading(true);
    if (selectedHost?.id) {
      data.host_id = selectedHost.id;
      try {
        sdk.setTable("property");
        const result = await sdk.callRestAPI(
          {
            address_line_1: data.address_line_1,
            address_line_2: data.address_line_2,
            city: data.city,
            country: data.country,
            zip: data.zip,
            status: 1,
            verified: 1,
            host_id: data.host_id,
            name: data.name,
          },
          "POST",
        );
        if (!result.error) {
          showToast(globalDispatch, "Added");
          navigate("/admin/property");
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
        setError("address_line_1", {
          type: "manual",
          message: error.message,
        });
        tokenExpireError(dispatch, error.message);
      }
    } else {
      return setError("host_email", {
        type: "manual",
        message: "Please select a valid host email",
      });
    }
    setLoading(false);
  };

  const onError = () => {
    if (!selectedHost?.id) {
      return setError("host_email", {
        type: "manual",
        message: "Please select a valid host email",
      });
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property",
      },
    });

    fetchHosts();
  }, []);

  return (
    <AddAdminPageLayout
      title={"Property"}
      backTo={"property"}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="name"
          >
            Property Name
          </label>
          <input
            placeholder="Property Name"
            {...register("name")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.name?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.name?.message}</p>
        </div>
        <div className="mb-4 normal-case">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="host_id"
          >
            Host Email
          </label>
          <SmartSearchV2
            selected={selectedHost}
            setSelected={setSelectedHost}
            data={hosts}
            fieldToDisplay="email"
          />
          <p className="text-xs normal-case italic text-red-500">{errors.host_email?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="address_line_1"
          >
            Address Line 1
          </label>
          <input
            placeholder="Address line 1"
            {...register("address_line_1")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.address_line_1?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.address_line_1?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="address_line_2"
          >
            Address Line 2 (optional)
          </label>
          <input
            placeholder="Address line 2"
            {...register("address_line_2")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.address_line_2?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.address_line_2?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="city"
          >
            City
          </label>
          <input
            placeholder="City"
            {...register("city")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.city?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.city?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="country"
          >
            Country
          </label>
          <input
            placeholder="Country"
            {...register("country")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.country?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.country?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="zip"
          >
            Zip Code
          </label>
          <input
            type="number"
            placeholder="Zip Code"
            {...register("zip")}
            className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.zip?.message ? "border-red-500" : ""}`}
          />
          <p className="text-xs normal-case italic text-red-500">{errors.zip?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/property")}
            className="mb-1 flex-1 rounded border border-[#667085] !bg-gradient-to-r px-6 py-2 text-sm font-semibold text-[#667085] outline-none focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="ml-5 mb-1 flex-1 rounded !bg-gradient-to-r from-[#33D4B7]  to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
          >
            Save
          </button>
        </div>
      </form>
    </AddAdminPageLayout>
  );
};

export default AddAdminPropertyPage;
