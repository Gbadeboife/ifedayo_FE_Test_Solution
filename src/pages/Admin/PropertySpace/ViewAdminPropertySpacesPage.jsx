import React, { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { GlobalContext } from "@/globalContext";
import { useEffect } from "react";
import { callCustomAPI } from "@/utils/callCustomAPI";

let sdk = new MkdSDK();

const ViewAdminPropertySpacesPage = ({ page }) => {
  const { state: propertySpace } = useLocation();

  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(1);

  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [faqs, setFaqs] = useState([]);

  async function fetchImages() {
    const where = [`property_spaces_id = ${id}`];
    try {
      const result = await callCustomAPI("property-space-images", "post", { page: 1, limit: 7, where }, "PAGINATE");
      if (Array.isArray(result.list)) {
        setImages(result.list);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  async function fetchAmenities() {
    const where = [`property_spaces_id = ${id}`];
    try {
      const result = await callCustomAPI("property-spaces-amenitites", "post", { page: 1, limit: 1000, where }, "PAGINATE");
      if (Array.isArray(result.list)) {
        setAmenities(result.list.map((res) => res.amenity_name));
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  async function fetchReviews() {
    const role = localStorage.getItem("role") ?? "customer";
    const where = [`ergo_review.property_spaces_id = ${id} AND ergo_review.status = 1 AND ergo_review.given_by = 'customer'`];
    try {
      const result = await callCustomAPI("review-hashtag", "post", { page: 1, limit: 1000, where, user: role }, "PAGINATE");
      if (Array.isArray(result.list)) {
        setReviews(result.list);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  async function fetchFaqs() {
    sdk.setTable("property_space_faq");
    const payload = { property_space_id: Number(id) };
    try {
      const result = await sdk.callRestAPI({ page: 1, limit: 1000, payload }, "PAGINATE");
      if (Array.isArray(result.list)) {
        setFaqs(result.list);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  useEffect(() => {
    fetchImages();
    fetchAmenities();
    fetchFaqs();
    fetchReviews();
  }, []);

  const tabs = [
    {
      key: 0,
      name: "Summary",
      component: (
        <SpaceSummary
          images={images}
          faqs={faqs}
          amenities={amenities}
          reviews={reviews}
        />
      ),
    },
    {
      key: 1,
      name: "Links",
      component: (
        <div className="flex min-h-[500px] items-center justify-center gap-12 p-8">
          <Link
            to={`/admin/property_spaces_images?property_spaces_id=${id}`}
            target={"_blank"}
            className="border border-blue-500 p-5 duration-200 hover:scale-150"
          >
            View Images
          </Link>
          <Link
            to={`/admin/property_spaces_faq?property_space_id=${id}`}
            className="border border-blue-500 p-5 duration-200 hover:scale-150"
            target={"_blank"}
          >
            View FAQs
          </Link>
          <Link
            to={`/admin/property_spaces_amenitites?property_spaces_id=${id}`}
            className="border border-blue-500 p-5 duration-200 hover:scale-150"
            target={"_blank"}
          >
            View Amenities
          </Link>
          <Link
            to={`/admin/booking?property_space_id=${id}`}
            className="border border-blue-500 p-5 duration-200 hover:scale-150"
            target={"_blank"}
          >
            View Bookings
          </Link>
          <Link
            to={`/admin/review/customer?property_spaces_id=${id}`}
            className="border border-blue-500 p-5 duration-200 hover:scale-150"
            target={"_blank"}
          >
            View Reviews
          </Link>
        </div>
      ),
    },
  ];

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces",
      },
    });
  }, []);

  return (
    <>
      <div className="">
        <h1 className="text-center text-4xl">{propertySpace?.property_name}</h1>
        <ul className="-mb-px flex flex-wrap">
          {tabs.map((tab) => (
            <li
              key={tab.key}
              className="mr-2"
            >
              <button
                onClick={() => setActiveTab(tab.key)}
                className={`inline-block p-4 ${
                  activeTab === tab.key ? "border-[#111827] font-bold text-[#111827]" : " border-transparent hover:border-gray-300 hover:text-gray-600"
                }  rounded-t-lg border-b-2 `}
              >
                {tab.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {tabs[activeTab].component}
    </>
  );
};

export default ViewAdminPropertySpacesPage;

const SpaceSummary = ({ images, amenities, faqs, reviews }) => {
  return (
    <div className="p-3">
      <h1 className="my-4 text-3xl font-semibold">Images</h1>
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <Link
            to={`/admin/property_spaces_images?id=${img.id}`}
            key={img.id}
          >
            <img
              className="max-w-60 max-h-60 border"
              src={img.photo_url}
            />
          </Link>
        ))}
      </div>
      <br />
      <br />
      <h1 className="my-4 text-3xl font-semibold">Amenities</h1>
      <div className="flex flex-col gap-3">
        {amenities.map((am, idx) => (
          <li key={idx}>{am}</li>
        ))}
      </div>
      <br />
      <br />
      <h1 className="my-4 text-3xl font-semibold">FAQS</h1>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, idx) => (
          <li key={idx}>{faq.question}</li>
        ))}
      </div>
      <br />
      <br />
      <h1 className="my-4 text-3xl font-semibold">Reviews</h1>
      <div className="flex flex-col gap-3">
        {reviews.map((rv) => (
          <li key={rv.id}>{rv}</li>
        ))}
      </div>
    </div>
  );
};
