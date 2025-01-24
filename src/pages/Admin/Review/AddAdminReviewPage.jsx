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

const AddAdminReviewPage = () => {
  let sdk = new MkdSDK();
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);

  const [selectedSpace, setSelectedSpace] = React.useState();
  const [propertySpaces, setPropertySpaces] = React.useState([]);

  const [selectedHost, setSelectedHost] = React.useState({});
  const [hosts, setHosts] = React.useState([]);

  const [selectedCustomer, setSelectedCustomer] = React.useState({});
  const [customers, setCustomers] = React.useState([]);

  const [selectedHashtag, setSelectedHashtag] = React.useState([]);
  const [hashtags, setHashtags] = React.useState([]);

  const schema = yup
    .object({
      booking_id: yup.number().required("Booking ID is required").positive().integer().typeError("Booking ID must be a number"),
      comment: yup.string().required("Comment is required"),
    })
    .required();
  const userType = [
    {
      key: "customer",
      value: "customer",
    },
    {
      key: "host",
      value: "host",
    },
  ];
  const [selectedUserType, setSelectedUserType] = React.useState(userType[1].value);

  const ratings = [
    { key: "1", value: "1" },
    {
      key: "2",
      value: "2",
    },
    { key: "3", value: "3" },
    { key: "4", value: "4" },
    { key: "5", value: "5" },
  ];

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const checkRating = (data) => {
    if (selectedUserType === "customer") {
      if (isNaN(data.host_rating)) {
        return setError("host_rating", {
          type: "manual",
          message: "Host rating is required",
        });
      }
      if (isNaN(data.space_rating)) {
        return setError("space_rating", {
          type: "manual",
          message: "Space rating is required",
        });
      }
    } else {
      if (isNaN(data.customer_rating)) {
        return setError("customer_rating", {
          type: "manual",
          message: "Customer rating is required",
        });
      }
    }
    confirmBookingId(data);
  };

  const confirmBookingId = async (data) => {
    try {
      sdk.setTable("booking");
      const result = await sdk.callRestAPI(
        {
          id: data.booking_id,
        },
        "GET",
      );
      if (!result.error && result?.model) {
        onSubmit(data);
      } else {
        setError("booking_id", {
          type: "manual",
          message: "Booking with this ID doesn't exist",
        });
      }
    } catch (error) {
      console.log("Error", error);
      setError("booking_id", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  async function getCustomerData(pageNum, limitNum, data) {
    try {
      sdk.setTable("user");
      const payload = { email: data.email || undefined, role: "customer" };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limitNum,
        },
        "PAGINATE",
      );
      const { list } = result;
      setCustomers(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function getHostData(pageNum, limitNum, data) {
    try {
      sdk.setTable("user");
      const payload = { email: data.email || undefined, role: "host" };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limitNum,
        },
        "PAGINATE",
      );
      const { list } = result;
      setHosts(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  async function getPropertySpaceData(pageNum, limit, data) {
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

  async function getHashTags(pageNum, limit, data) {
    try {
      sdk.setTable("hashtag");
      const payload = { name: data.name || undefined };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limit,
        },
        "PAGINATE",
      );
      const { list } = result;
      setHashtags(list);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  const addHashTagToReview = async (reviewId, selected) => {
    try {
      sdk.setTable("review_hashtag");
      const hashtags = selected.map((hashtag) =>
        sdk.callRestAPI(
          {
            hashtag_id: hashtag.id,
            review_id: reviewId,
          },
          "POST",
        ),
      );
      await Promise.all(hashtags);
    } catch (error) {
      console.log("Error", error);
      tokenExpireError(dispatch, error.message);
    }
  };

  const onSubmit = async (data) => {
    if (selectedCustomer?.id && selectedHost?.id && selectedSpace?.id) {
      let postDate = new Date();
      let review = {
        customer_id: selectedCustomer.id,
        host_id: selectedHost.id,
        property_spaces_id: selectedSpace.id,
        booking_id: data.booking_id,
        comment: data.comment,
        customer_rating: null,
        host_rating: null,
        space_rating: null,
        post_date: postDate.toISOString(),
        status: 0,
      };

      if (selectedUserType === "host") {
        review.customer_rating = data.customer_rating || 0;
        review.given_by = "host";
        review.received_by = "customer";
      } else {
        review.host_rating = data.host_rating || 0;
        review.space_rating = data.space_rating || 0;
        review.given_by = "customer";
        review.received_by = "host";
      }
      try {
        const result = await sdk.callRawAPI("/v2/api/custom/ergo/review/POST", { ...review }, "POST");
        if (!result.error) {
          if (selectedHashtag.length > 0) {
            await addHashTagToReview(result.message, selectedHashtag);
          }
          showToast(globalDispatch, "Added");
          navigate("/admin/review");
        }
      } catch (error) {
        console.log("Error", error);
        showToast(globalDispatch, error.message);
        tokenExpireError(dispatch, error.message);
      }
    } else {
      if (!selectedCustomer?.id) {
        setError("customer_email", {
          type: "manual",
          message: "Please select a customer",
        });
      }
      if (!selectedHost?.id) {
        setError("host_email", {
          type: "manual",
          message: "Please select a host",
        });
      }
      if (!selectedSpace?.id) {
        setError("property_spaces_id", {
          type: "manual",
          message: "Please select a Property space",
        });
      }
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "review",
      },
    });
    getHashTags();
  }, []);

  const onError = () => {
    if (!selectedCustomer?.id) {
      setError("customer_email", {
        type: "manual",
        message: "Please select a customer",
      });
    }
    if (!selectedHost?.id) {
      setError("host_email", {
        type: "manual",
        message: "Please select a host",
      });
    }
    if (!selectedSpace?.id) {
      setError("property_spaces_id", {
        type: "manual",
        message: "Please select a Property space",
      });
    }
  };

  return (
    <AddAdminPageLayout
      title={"Review"}
      backTo={"review"}
    >
      <div className="mb-5 max-w-lg">
        <label
          htmlFor="userType"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Select Who you are reviewing as
        </label>
        <select
          name="userType"
          id="userType"
          className="   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
          defaultValue="host"
          onChange={(e) => setSelectedUserType(e.target.value)}
        >
          {userType.map((option) => (
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
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(checkRating, onError)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="customer_email"
          >
            Customer
          </label>
          <SmartSearch
            selectedData={selectedCustomer}
            setSelectedData={setSelectedCustomer}
            data={customers}
            getData={getCustomerData}
            field="email"
            errorField="customer_email"
            setError={setError}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.customer_email?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="host_email"
          >
            Host
          </label>
          <SmartSearch
            selectedData={selectedHost}
            setSelectedData={setSelectedHost}
            data={hosts}
            getData={getHostData}
            field="email"
            errorField="host_email"
            setError={setError}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.host_email?.message}</p>
        </div>
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="property_id"
          >
            Property Space
          </label>
          <SmartSearch
            selectedData={selectedSpace}
            setSelectedData={setSelectedSpace}
            data={propertySpaces}
            getData={getPropertySpaceData}
            field="property_name"
            field2="space_category"
            errorField="property_spaces_id"
            setError={setError}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.property_spaces_id?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="booking_id"
          >
            Booking ID
          </label>
          <input
            type="number"
            placeholder="Booking ID"
            {...register("booking_id")}
            className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.booking_id?.message ? "border-red-500" : ""}`}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.booking_id?.message}</p>
        </div>

        {selectedUserType === "customer" ? (
          <>
            <div className="mb-4 ">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="host_rating"
              >
                Host Rating
              </label>
              <select
                name="host_rating"
                id="host_rating"
                className="   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
                {...register("host_rating")}
              >
                <option
                  selected
                  value={null}
                  hidden
                >
                  Select Option
                </option>
                {ratings.map((option) => (
                  <option
                    name="host_rating"
                    value={option.key}
                    key={option.key}
                  >
                    {option.value}
                  </option>
                ))}
              </select>
              <p className="text-red-500 text-xs italic normal-case">{errors.host_rating?.message}</p>
            </div>
            <div className="mb-4 ">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="space_rating"
              >
                Space Rating
              </label>
              <select
                name="space_rating"
                id="space_rating"
                className="   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
                {...register("space_rating")}
              >
                <option
                  selected
                  value={null}
                  hidden
                >
                  Select Option
                </option>
                {ratings.map((option) => (
                  <option
                    name="space_rating"
                    value={option.key}
                    key={option.key}
                  >
                    {option.value}
                  </option>
                ))}
              </select>
              <p className="text-red-500 text-xs italic normal-case">{errors.space_rating?.message}</p>
            </div>
          </>
        ) : (
          <div className="mb-4 ">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="customer_rating"
            >
              Rating
            </label>
            <select
              name="customer_rating"
              id="customer_rating"
              className="   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
              {...register("customer_rating")}
              defaultValue={null}
            >
              <option hidden>Select Option</option>
              {ratings.map((option) => (
                <option
                  name="customer_rating"
                  value={option.key}
                  key={option.key}
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-red-500 text-xs italic normal-case">{errors.customer_rating?.message}</p>
          </div>
        )}
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="comment"
          >
            Comment
          </label>
          <textarea
            placeholder="comment"
            {...register("comment")}
            className={`"shadow   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${errors.comment?.message ? "border-red-500" : ""}`}
            rows={15}
          ></textarea>
          <p className="text-red-500 text-xs italic normal-case">{errors.comment?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="hashtags"
          >
            Hashtags
            <span className="text-xxs text-gray-500 ml-2">Separate using a comma " , "</span>
          </label>
          <SmartSearch
            selectedData={selectedHashtag}
            setSelectedData={setSelectedHashtag}
            multiple={true}
            data={hashtags}
            getData={getHashTags}
            field="name"
            errorField="hashtags"
            setError={setError}
          />
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/review")}
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

export default AddAdminReviewPage;
