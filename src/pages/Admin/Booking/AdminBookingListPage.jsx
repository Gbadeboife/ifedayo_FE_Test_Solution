import React, { Fragment } from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { clearSearchParams, parseSearchParams, secondsToHour } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import Button from "@/components/Button";
import { Menu, Transition } from "@headlessui/react";
import Icon from "@/components/Icons";
import moment from "moment";
import SmartSearch from "@/components/SmartSearch";
import CsvDownloadButton from "react-json-to-csv";
import { ID_PREFIX } from "@/utils/constants";

let sdk = new MkdSDK();

const AdminBookingListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);

  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const [resetClicked, setResetClicked] = React.useState(false);
  const [selectedSpace, setSelectedSpace] = React.useState();
  const [propertySpaces, setPropertySpaces] = React.useState([]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // TODO: find a better way to do this
  const [searchParams2] = useSearchParams(localStorage.getItem("admin_booking_filter") ?? "");

  const schema = yup.object({
    id: yup.string(),
    property_space_id: yup.string(),
    customer_name: yup.string(),
    customer_email: yup.string(),
    host_email: yup.string(),
    status: yup.string(),
    payment_status: yup.string(),
    booking_start_time: yup.string(),
    booking_time: yup.string(),
    duration: yup.string(),
  });
  const {
    reset,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: (() => {
      let fromSearch = parseSearchParams(searchParams);
      if (Object.keys(fromSearch).length > 0) {
        return fromSearch;
      }
      return parseSearchParams(searchParams2);
    })(),
  });

  const selectStatus = [
    { key: "", value: "All" },
    { key: "0", value: "Pending" },
    { key: "1", value: "Upcoming" },
    { key: "2", value: "Ongoing" },
    { key: "3", value: "Complete" },
    { key: "4", value: "Declined" },
    { key: "5", value: "Cancelled" },
  ];

  const selectPaymentStatus = [
    { key: "", value: "All" },
    { key: "0", value: "Pending" },
    { key: "1", value: "Paid" },
    { key: "2", value: "Declined" },
    { key: "3", value: "Cancelled" },
  ];

  const statusMapping = [
    { key: "0", value: "Pending" },
    { key: "1", value: "Upcoming" },
    { key: "2", value: "Ongoing" },
    { key: "3", value: "Complete" },
    { key: "4", value: "Declined" },
    { key: "5", value: "Cancelled" },
  ];

  async function getPropertySpacesData(pageNum, limit, data) {
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-spaces/PAGINATE",
        {
          where: [data?.property_name ? `ergo_property.name LIKE '%${data.property_name}%' OR ergo_spaces.category LIKE '%${data.property_name}%'` : 1, "ergo_property.deleted_at IS NULL"],
          page: pageNum,
          limit: limit,
        },
        "POST",
      );
      const { list } = result;
      setPropertySpaces(list);
    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  }

  function onSort(accessor, direction) { }

  function updatePageSize(limit) {
    (async function () {
      setPageSize(limit);
      await getData(0, limit);
    })();
  }

  function previousPage() {
    (async function () {
      await getData(currentPage - 1 > 0 ? currentPage - 1 : 0, pageSize);
    })();
  }

  function nextPage() {
    (async function () {
      await getData(currentPage + 1 <= pageCount ? currentPage + 1 : 0, pageSize);
    })();
  }

  async function getData(pageNum, limitNum, clicked) {
    let data = parseSearchParams(searchParams);
    let data2 = parseSearchParams(searchParams2);

    data = Object.keys(data).length < 1 ? parseSearchParams(searchParams2) : data;

    if (clicked) {
      data = {};
      data.id = data.id?.replace(ID_PREFIX.BOOKINGS, "");
    }
    data.id = data.id?.replace(ID_PREFIX.BOOKINGS, "");

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/booking/PAGINATE",
        {
          where: [
            data
              ? `${data.id ? `ergo_booking.id = '${data.id}'` : "1"} AND ${data.customer_name ? `customer.first_name LIKE '%${data.customer_name}%' OR customer.last_name LIKE '%${data.customer_name}%'` : "1"
              } AND ${data.status ? `ergo_booking.status = ${data.status}` : "1"} AND ${data.payment_status ? `ergo_booking.payment_status = ${data.payment_status}` : "1"} AND ${data.booking_start_time ? `ergo_booking.booking_start_time LIKE '%${data.booking_start_time}%'` : "1"
              } AND ${data.property_space_id ? `ergo_booking.property_space_id LIKE '%${data.property_space_id}%'` : "1"} AND ${data.host_email ? `ergo_user.email LIKE '%${data.host_email}%'` : "1"
              } AND ${data.customer_email ? `customer.email LIKE '%${data.customer_email}%'` : "1"}`
              : 1,
            "ergo_booking.deleted_at IS NULL",
          ],
          page: pageNum,
          limit: limitNum,
          sortId: "update_at",
          direction: "DESC",
        },
        "POST",
      );

      const { list, total, limit, num_pages, page } = result;
      setCurrentTableData(list);
      setPageSize(limit);
      setPageCount(num_pages);
      setPage(page);
      setDataTotal(total);
      setCanPreviousPage(page > 1);
      setCanNextPage(page + 1 <= num_pages);
    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  }

  const onSubmit = (data) => {
    searchParams.set("id", data.id);
    searchParams.set("property_space_id", selectedSpace?.id ?? "");
    searchParams.set("customer_name", data.customer_name);
    searchParams.set("status", data.status);
    searchParams.set("payment_status", data.payment_status);
    searchParams.set("booking_start_time", data.booking_start_time);
    searchParams.set("customer_email", data.customer_email);
    searchParams.set("host_email", data.host_email);

    setSearchParams(searchParams);
    localStorage.setItem("admin_booking_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "booking",
      },
    });

    (async function () {
      await getData(1, pageSize);
      getPropertySpacesData(1, 10);
    })();
  }, []);

  return (
    <>
      <form
        className="mb-10 rounded bg-white p-5 shadow"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Booking Search</h4>
          <AddButton
            link={"/admin/add-booking"}
            text="Add new Booking"
          />
        </div>

        <div className="filter-form-holder mt-10 flex flex-wrap">
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="id"
            >
              ID
            </label>
            <input
              placeholder="ID"
              {...register("id")}
              className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.id?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
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
            <p className="text-xs italic text-red-500">{errors.property_spaces_id?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="customer_name"
            >
              Customer
            </label>
            <input
              placeholder="Customer"
              {...register("customer_name")}
              className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.customer_name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.customer_name?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">Status</label>
            <select
              className="mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("status")}
            >
              {selectStatus.map((option) => (
                <option
                  name="Status"
                  value={option.key}
                  key={option.key}
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500"></p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">Payment Status</label>
            <select
              className="mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("payment_status")}
            >
              {selectPaymentStatus.map((option) => (
                <option
                  name="payment_status"
                  value={option.key}
                  key={option.key}
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500"></p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="booking_start_time"
            >
              Booking Date
            </label>
            <input
              type="date"
              placeholder="Booking date"
              {...register("booking_start_time")}
              className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.booking_start_time?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.booking_start_time?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="customer_email"
            >
              Customer Email
            </label>
            <input
              {...register("customer_email")}
              className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.customer_email?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.customer_email?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="host_email"
            >
              Host Email
            </label>
            <input
              {...register("host_email")}
              className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.host_email?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.host_email?.message}</p>
          </div>
        </div>
        <Button text="Search"
          setResetClicked={setResetClicked}
        />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            setSelectedSpace({});
            reset({ id: "", customer_name: "", payment_status: "", status: "", booking_start_time: "", property_space_id: "", customer_email: "", host_email: "" }, getData(currentPage, pageSize, true));
            localStorage.removeItem("admin_booking_filter");
            clearSearchParams(searchParams, setSearchParams);
          }}
        >
          Reset
        </button>
      </form>

      <div className="flex justify-end bg-white py-3 pt-5">
        <CsvDownloadButton
          id="test-table-xls-button"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
          filename="booking"
          data={data}
        />
      </div>

      <div
        className="max-w-[80vw] rounded bg-white p-5 shadow"
        id="table-to-xls"
      >
        {data.map((data) => (
          <div
            key={data.id}
            className="mb-4 flex flex-col justify-between rounded border px-5 py-4 lg:flex-row"
          >
            <div>{ID_PREFIX.BOOKINGS + data.id}</div>
            <img
              src={data.image_url}
              className="h-24 w-[135px] object-contain"
              alt="property_image"
            />
            <div className="mb-4 min-w-[219px] max-w-[219px]">
              <p className="mb-1 text-xl font-semibold text-[#101828]">{data.property_name}</p>
              <p className="mb-1 text-xs font-medium">{data.space_category}</p>
              <p className="w-fit rounded bg-gray-200 p-2 text-xs">{statusMapping.find((status) => status.key == data.status)?.value}</p>
            </div>
            <div className="mb-4 min-w-[219px] max-w-[219px]">
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <p className="mb-1 w-20 text-xs font-medium md:w-[unset] ">Host</p>
                <p className="mb-1 text-sm">
                  {data.host_last_name}, {data.host_first_name}{" "}
                </p>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <p className="mb-1 w-20 text-xs font-medium md:w-[unset] ">Customer</p>
                <p className="mb-1 whitespace-nowrap text-xs">
                  {data.customer_last_name}, {data.customer_first_name}{" "}
                </p>
              </div>
            </div>
            <div className="mb-4 min-w-[72px] max-w-none md:max-w-[72px] ">
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <p className="mb-1 w-20 text-xs font-medium md:w-[unset] ">Date</p>
                <p className="mb-1 text-sm">{moment(data.booking_start_time).format("MM/DD/YY")} </p>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <p className="mb-1 w-20 text-xs font-medium md:w-[unset] ">Duration</p>
                <p className="mb-1 whitespace-nowrap text-xs">{secondsToHour(data.duration)}</p>
              </div>
            </div>
            <div className="mb-4 min-w-[72px] max-w-none md:max-w-[72px] ">
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <p className="mb-1 w-20 text-xs font-medium md:w-[unset] ">Rate</p>
                <p className="mb-1 text-sm">&#36;{data?.rate?.toFixed(2)} </p>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <p className="mb-1 w-20 text-xs font-medium md:w-[unset] ">Tax</p>
                <p className="mb-1 text-xs">&#36;{data?.tax?.toFixed(2)}</p>
              </div>
            </div>
            <div className="mb-4 min-w-[72px] max-w-none md:max-w-[72px] ">
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <p className="mb-1 w-20 text-xs font-medium md:w-[unset] ">Total</p>
                <p className="mb-1 text-xs">&#36;{((data?.total ?? 0) + (data?.addon_cost ?? 0)).toFixed(2)} </p>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <p className="mb-1 w-20 text-xs font-medium md:w-[unset] ">Commission</p>
                <p className="mb-1 text-xs">&#36;{data?.commission?.toFixed(2)}</p>
              </div>
            </div>
            <Menu
              as="div"
              className="relative inline-block min-w-[60px] max-w-[60px] text-left"
            >
              <div className="">
                <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-1 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#33D4B7] focus:ring-offset-2 focus:ring-offset-gray-100">
                  <Icon type="dots" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 z-10 mt-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none lg:right-0 lg:left-[unset]">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate(`/admin/edit-booking/${data.id}`)}
                          className={`${active ? "bg-gray-100 text-gray-900" : "text-gray-700"} block w-full px-4 py-2 text-left text-sm`}
                        >
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate(`/admin/view-booking/${data.id}`)}
                          className={`${active ? "bg-gray-100 text-gray-900" : "text-gray-700"} block w-full px-4 py-2 text-left text-sm`}
                        >
                          View
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        ))}
      </div>
      <PaginationBar
        currentPage={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        totalNumber={dataTotal}
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        updatePageSize={updatePageSize}
        previousPage={previousPage}
        nextPage={nextPage}
      />
    </>
  );
};

export default AdminBookingListPage;
