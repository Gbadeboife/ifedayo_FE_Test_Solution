import React, { Fragment } from "react";
import MkdSDK from "@/utils/MkdSDK";
import PaginationBar from "./PaginationBar";
import PaginationHeader from "./PaginationHeader";
import { Menu, Transition } from "@headlessui/react";
import Icon from "./Icons";
import { useNavigate } from "react-router-dom";
import { secondsToHour } from "@/utils/utils";
import moment from "moment";
import { ID_PREFIX } from "@/utils/constants";

const Payment = ({ id, table }) => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);

  const payoutMapping = [
    { key: "0", value: "Pending" },
    { key: "1", value: "Initiated" },
    { key: "2", value: "Paid" },
    { key: "3", value: "Cancelled" }
  ];

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
    try {
      let sdk = new MkdSDK();
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/payout/PAGINATE",
        {
          where: [table ? `${table === "host" ? `ergo_user.id = ${id}` : "1"}` : 1],
          page: pageNum,
          limit: limitNum
        },
        "POST"
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
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
    }
  }

  React.useEffect(() => {
    (async function () {
      await getData(1, pageSize);
    })();
  }, []);

  return (
    <>
      <PaginationHeader
        currentPage={currentPage}
        pageSize={pageSize}
        totalNumber={dataTotal}
        updatePageSize={updatePageSize}
      />
      <div className="overflow-x-auto  p-5 bg-white shadow rounded">
        {data.map((data, index) => (
          <div
            key={index}
            className="border rounded px-5 py-4 flex justify-between flex-col lg:flex-row mb-4"
          >
            <div>{ID_PREFIX.PAYOUT + data.id}</div>
            <div className="min-w-[219px] max-w-[219px] mr-[22px]">
              <p className="text-xs mb-1 font-medium ">Host</p>
              <p className="mb-1 text-sm">
                {data.host_last_name}, {data.host_first_name}{" "}
              </p>
              <p className="text-xs mb-1 font-medium ">Customer</p>
              <p className="mb-1 text-sm">
                {data.customer_last_name}, {data.customer_first_name}{" "}
              </p>
            </div>
            <div className="min-w-[219px] max-w-[219px] mr-[22px]">
              <p className="text-xs mb-1 font-medium ">Booking Date</p>
              <p className="mb-1 text-sm">{data.create_at} </p>
              <p className="text-xs mb-1 font-medium ">Order Number</p>
              <p className="mb-1 text-sm">{data.id}</p>
            </div>
            <div className="min-w-[72px] max-w-[72px] mb-4">
              <p className="text-xs mb-1 font-medium ">Total</p>
              <p className="mb-1 text-sm">&#36;{data?.total?.toFixed(2)} </p>
              <p className="text-xs mb-1 font-medium ">Tax</p>
              <p className="mb-1 text-sm">&#36;{data?.tax?.toFixed(2)}</p>
            </div>
            <div className="min-w-[72px] max-w-[72px] mb-4">
              <p className="text-xs mb-1 font-medium ">Commission</p>
              <p className="mb-1 text-sm">&#36;{data?.commission?.toFixed(2)} </p>
              <p className="text-xs mb-1 font-medium ">Payout Date</p>
              <p className="mb-1 text-sm">{data?.initiated_at ? moment(data.initiated_at).add(7, "days").format("MM/DD/YY") : ""}</p>
            </div>
            <div className="flex min-w-[60px] max-w-[60px] mr-[22px] items-center justify-center">
              <p>{payoutMapping.find((status) => status.key == data.status)?.value}</p>
            </div>
            <Menu
              as="div"
              className="relative min-w-[60px] max-w-[60px] inline-block text-left"
            >
              <div className="h-full flex items-center">
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
                          className={`${active ? "bg-gray-100 text-gray-900" : "text-gray-700"} w-full text-left block px-4 py-2 text-sm`}
                        >
                          Edit
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

export default Payment;
