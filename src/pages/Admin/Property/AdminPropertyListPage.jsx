import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { useSearchParams, Link } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import Button from "@/components/Button";
import Table from "@/components/Table";
import AddButton from "@/components/AddButton";
import PaginationHeader from "@/components/PaginationHeader";
import ReactHtmlTableToExcel from "react-html-table-to-excel";
import { ID_PREFIX } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";

let sdk = new MkdSDK();

const AdminPropertyListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState([]);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams(localStorage.getItem("admin_property_filter") ?? "");

  const schema = yup.object({
    address_line_1: yup.string(),
    address_line_2: yup.string(),
    city: yup.string(),
    country: yup.string(),
    zip: yup.string(),
    host_id: yup.number().positive().integer(),
    name: yup.string(),
  });

  const {
    reset,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: parseSearchParams(searchParams),
  });

  function onSort(accessor) {
    const columns = tableColumns;
    const index = columns.findIndex((column) => column.accessor === accessor);
    const column = columns[index];
    column.isSortedDesc = !column.isSortedDesc;
    columns.splice(index, 1, column);
    setTableColumns(() => [...columns]);
    const sortedList = selector(data, column.isSortedDesc, accessor);
    setCurrentTableData(sortedList);
  }
  function selector(users, isSortedDesc, accessor) {
    if (accessor?.split(",").length > 1) {
      accessor = accessor.split(",")[0];
    }

    return users.sort((a, b) => {
      if (isSortedDesc) {
        if (isNaN(a[accessor])) {
          return a[accessor]?.toLowerCase() < b[accessor]?.toLowerCase() ? 1 : -1;
        } else {
          return a[accessor] < b[accessor] ? 1 : -1;
        }
      }
      if (!isSortedDesc) {
        if (isNaN(a[accessor])) {
          return a[accessor]?.toLowerCase() < b[accessor]?.toLowerCase() ? -1 : 1;
        } else {
          return a[accessor] < b[accessor] ? -1 : 1;
        }
      }
    });
  }
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
    const data = parseSearchParams(searchParams);
    data.id = data.id?.replace(ID_PREFIX.PROPERTY, "");

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property/PAGINATE",
        {
          where: [
            data
              ? `${data.id ? `ergo_property.id = '${data.id}'` : "1"} 
                AND ${data.host_id ? `ergo_property.host_id = ${data.host_id}` : "1"} 
                AND ${data.email ? `ergo_user.email LIKE '%${data.email}%'` : "1"} 
                AND ${data.zip ? `ergo_property.zip LIKE '%${data.zip}%'` : "1"} 
                AND ${data.country ? `ergo_property.country LIKE '%${data.country}%'` : "1"}`
              : 1,
            "ergo_property.deleted_at IS NULL",
          ],
          page: pageNum,
          limit: limitNum,
          sortId: "update_at",
          direction: "DESC",
        },
        "POST",
      );

      const { list, total, limit, num_pages, page } = result;

      const sortedList = selector(list, false);
      setCurrentTableData(sortedList);
      setPageSize(limit);
      setPageCount(num_pages);
      setPage(page);
      setDataTotal(total);
      setCanPreviousPage(page > 1);
      setCanNextPage(page + 1 <= num_pages);
    } catch (error) {
      console.log("ERROR", error);
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  }

  const onSubmit = (data) => {
    searchParams.set("id", data.id);
    searchParams.set("city", data.city);
    searchParams.set("zip", data.zip);
    searchParams.set("email", data.email);
    setSearchParams(searchParams);
    localStorage.setItem("admin_property_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property",
      },
    });
    fetchColumnOrder();
    getData(1, pageSize);
  }, []);

  async function fetchColumnOrder() {
    sdk.setTable("settings");
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload: { key_name: "admin_property_space_column_order" } }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_property));
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Property</h4>
          <AddButton
            link={"/admin/add-property"}
            text="Add New Property"
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
              {...register("id")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.id?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="host_id"
            >
              Host's Email
            </label>
            <input
              {...register("email")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.host_id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.host_id?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="city"
            >
              City
            </label>
            <input
              {...register("city")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.city?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.city?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="zip"
            >
              Zip Code
            </label>
            <input
              type="number"
              {...register("zip")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.zip?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.zip?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ id: "", zip: "", host_id: "", city: "" });
            localStorage.removeItem("admin_property_filter");
            clearSearchParams(searchParams, setSearchParams);
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
        <Link
          to="/admin/column_order/property"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
        >
          Change Column Order
        </Link>{" "}
        <ReactHtmlTableToExcel
          id="test-table-xls-button"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
          table="table-to-xls"
          filename="property_spaces"
          sheet="property_spaces"
          buttonText="Export to xls"
        />
      </div>

      <div className="overflow-x-auto">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <Table
            columns={tableColumns}
            rows={data}
            emailActions
            tableType={"Property"}
            table1="property"
            deleteTitle={"Are you sure?"}
            deleteMessage="Are you sure you want to delete this Property?"
            onSort={onSort}
            id="table-to-xls"
          />
        </div>
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

export default AdminPropertyListPage;
