import React, { Fragment } from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import Button from "@/components/Button";
import PaginationHeader from "@/components/PaginationHeader";
import { Menu, Transition } from "@headlessui/react";
import Icon from "@/components/Icons";
import moment from "moment";
import CsvDownloadButton from "react-json-to-csv";
import { ID_PREFIX } from "@/utils/constants";

let sdk = new MkdSDK();

const AdminPayoutListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const [massPayout, setMassPayout] = React.useState(false);
  const [payouts, setPayouts] = React.useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  // TODO: find a better way to do this
  const [searchParams2] = useSearchParams(localStorage.getItem("admin_payout_filter") ?? "");

  const navigate = useNavigate();

  const schema = yup.object({
    host_name: yup.string(),
    customer_name: yup.string(),
    status: yup.string(),
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

  const selectPayoutStatus = [
    { key: "", value: "All" },
    { key: "0", value: "Pending" },
    { key: "1", value: "Initiated" },
    { key: "2", value: "Paid" },
    { key: "3", value: "Cancelled" },
  ];

  const payoutMapping = [
    { key: "0", value: "Pending" },
    { key: "1", value: "Initiated" },
    { key: "2", value: "Paid" },
    { key: "3", value: "Cancelled" },
  ];

  function onSort(accessor, direction) {}

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

  async function getData(pageNum, limitNum) {
    let data = parseSearchParams(searchParams);
    data = Object.keys(data).length < 1 ? parseSearchParams(searchParams2) : data;

    data.id = data.id?.replace(ID_PREFIX.PAYOUT, "");

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/payout/PAGINATE",
        {
          where: [
            data
              ? `${data.id ? `ergo_payout.id LIKE '%${data.id}%'` : "1"} AND ${
                  data.customer_name ? `customer.first_name LIKE '%${data.customer_name}%' OR customer.last_name LIKE '%${data.customer_name}%'` : "1"
                } AND ${data.status ? `ergo_payout.status LIKE '%${data.status}%'` : "1"} AND ${
                  data.host_name ? `ergo_user.first_name LIKE '%${data.host_name}%' OR ergo_user.last_name LIKE '%${data.host_name}%'` : "1"
                }`
              : 1,
            "ergo_payout.deleted_at IS NULL",
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
    searchParams.set("host_name", data.host_name);
    searchParams.set("customer_name", data.customer_name);
    searchParams.set("status", data.status);

    setSearchParams(searchParams);
    localStorage.setItem("admin_payout_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "payout",
      },
    });

    (async function () {
      await getData(1, pageSize);
    })();
  }, []);

  const onBulkSubmit = async (data) => {
    if (data.bulk_status == 1) {
      data.initiated_at = new Date().toISOString();
    }
    try {
      await Promise.all(payouts.map((id) => sdk.callRawAPI("/v2/api/custom/ergo/payout/PUT", { id, status: data.bulk_status, initiated_at: data.initiated_at }, "POST")));
      showToast(globalDispatch, "Successful");
      setPayouts([]);
      setMassPayout(false);
      getData(1, pageSize);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  };

  return (
    <>
      <form
        className="mb-10 rounded bg-white p-5 shadow"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Payout Search</h4>
          <AddButton
            link={"/admin/add-payout"}
            text="Add new Payout"
          />
        </div>
        <div className="filter-form-holder mt-10 flex max-w-4xl flex-wrap">
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="id"
            >
              ID
            </label>
            <input
              placeholder="ID"
              {...register("id")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.id?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="host_id"
            >
              Host
            </label>
            <input
              placeholder="Host"
              {...register("host_name")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.host_id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.host_name?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="customer_id"
            >
              Customer
            </label>
            <input
              placeholder="Customer"
              {...register("customer_name")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.customer_id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.customer_name?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="status"
            >
              Status
            </label>
            <select
              className="mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("status")}
            >
              {selectPayoutStatus.map((option) => (
                <option
                  name="status"
                  value={option.key}
                  key={option.key}
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.status?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ id: "", customer_name: "", status: "", host_name: "" });
            localStorage.removeItem("admin_payout_filter");
            clearSearchParams(searchParams, setSearchParams);
            clearSearchParams(searchParams2, setSearchParams);
            getData(currentPage, pageSize);
          }}
        >
          Reset
        </button>
      </form>

      <PaginationHeader
        currentPage={currentPage}
        pageSize={pageSize}
        totalNumber={dataTotal}
        updatePageSize={updatePageSize}
      />
      <div className="flex justify-end bg-white py-3 pt-5">
        <button
          className="font-inter mr-5 rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          onClick={() => setMassPayout((prev) => !prev)}
        >
          {massPayout ? "Turn off Bulk mode" : "Turn on Bulk mode"}
        </button>
        <CsvDownloadButton
          id="test-table-xls-button"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
          filename="payout"
          data={data}
        />
      </div>

      {payouts.length > 0 && massPayout ? (
        <>
          <form
            className="flex items-center justify-end bg-white p-5"
            onSubmit={handleSubmit(onBulkSubmit)}
          >
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="bulk_status"
              >
                Status
              </label>
              <select
                className=" mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
                {...register("bulk_status")}
              >
                {selectPayoutStatus.map((option) => (
                  <option
                    name="bulk_status"
                    value={option.key}
                    key={option.key}
                  >
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
            >
              Bulk Edit
            </button>
          </form>
        </>
      ) : null}

      <div
        className="max-w-[80vw]  rounded bg-white p-5 shadow"
        id="table-to-xls"
      >
        {data.map((data, index) => (
          <label
            key={index}
            className="mb-4 flex flex-col justify-between rounded border px-5 py-4 lg:flex-row"
          >
            {massPayout && (
              <input
                type="checkbox"
                value={data.id}
                checked={payouts.includes(String(data.id))}
                onChange={(e) => {
                  setPayouts((prev) => {
                    var copy = new Set(prev);
                    if (copy.has(e.target.value)) {
                      copy.delete(e.target.value);
                    } else {
                      copy.add(e.target.value);
                    }
                    return Array.from(copy);
                  });
                }}
              />
            )}
            <div>{ID_PREFIX.PAYOUT + data.id}</div>
            <div className="mr-[22px] min-w-[219px] max-w-[219px]">
              <p className="mb-1 text-xs font-medium ">Host</p>
              <p className="mb-1 text-sm">
                {data.host_last_name}, {data.host_first_name}{" "}
              </p>
              <p className="mb-1 text-xs font-medium ">Customer</p>
              <p className="mb-1 text-sm">
                {data.customer_last_name}, {data.customer_first_name}{" "}
              </p>
            </div>
            <div className="mr-[22px] min-w-[219px] max-w-[219px]">
              <p className="mb-1 text-xs font-medium ">Booking Date</p>
              <p className="mb-1 text-sm">{data.create_at} </p>
              <p className="mb-1 text-xs font-medium ">Order Number</p>
              <p className="mb-1 text-sm">{data.booking_id}</p>
            </div>
            <div className="mb-4 min-w-[72px] max-w-[72px]">
              <p className="mb-1 text-xs font-medium ">Total</p>
              <p className="mb-1 text-sm">&#36;{data?.total?.toFixed(2)} </p>
              <p className="mb-1 text-xs font-medium ">Tax</p>
              <p className="mb-1 text-sm">&#36;{data?.tax?.toFixed(2)}</p>
            </div>
            <div className="mb-4 min-w-[72px] max-w-[72px]">
              <p className="mb-1 text-xs font-medium ">Commission</p>
              <p className="mb-1 text-sm">&#36;{data?.commission?.toFixed(2)} </p>
              <p className="mb-1 text-xs font-medium ">Payout Date</p>
              <p className="mb-1 text-sm">{data?.initiated_at ? moment(data.initiated_at).add(7, "days").format("MM/DD/YY") : ""}</p>
            </div>
            <div className="mr-[22px] flex min-w-[60px] max-w-[60px] items-center justify-center">
              <p>{payoutMapping.find((status) => status.key == data.status)?.value}</p>
            </div>
            <Menu
              as="div"
              className="relative inline-block min-w-[60px] max-w-[60px] text-left"
            >
              <div className="flex h-full items-center">
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
                <Menu.Items className="absolute right-0 z-10 mt-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate(`/admin/edit-payout/${data.id}`)}
                          className={`${active ? "bg-gray-100 text-gray-900" : "text-gray-700"} block w-full px-4 py-2 text-left text-sm`}
                        >
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </label>
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

export default AdminPayoutListPage;
