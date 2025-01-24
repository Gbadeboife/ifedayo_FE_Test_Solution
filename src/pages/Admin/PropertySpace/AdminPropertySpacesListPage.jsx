import React, { useState } from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { parseSearchParams, clearSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import Button from "@/components/Button";
import Table from "@/components/Table";
import PaginationHeader from "@/components/PaginationHeader";
import ReactHtmlTableToExcel from "react-html-table-to-excel";
import { DRAFT_STATUS, ID_PREFIX } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";
import TreeSDK from "@/utils/TreeSDK";

let sdk = new MkdSDK();
let treeSdk = new TreeSDK();

const selectStatus = [
  { key: "", value: "All" },
  { key: "0", value: "HIDDEN" },
  { key: "1", value: "VISIBLE" },
];
const selectSpaceStatus = [
  { key: "", value: "All" },
  { key: "0", value: "UNDER REVIEW" },
  { key: "1", value: "APPROVED" },
  { key: "2", value: "DECLINED" },
];

const AdminPropertySpacesListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch, state } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState([]);
  const [spaces, setSpacesData] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  // TODO: find a better way to do this
  const [searchParams2] = useSearchParams(localStorage.getItem("admin_property_space_filter") ?? "");

  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);

  const schema = yup.object({
    property_name: yup.string(),
    status: yup.string(),
    category_name: yup.string(),
  });
  const {
    reset,
    register,
    handleSubmit,
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

  async function getSpacesData() {
    try {
      let filter = ["deleted_at,is"];
      const result = await treeSdk.getList("spaces", {
        filter,
        join: [],
      });
      if (Array.isArray(result.list)) {
        setSpacesData(result.list);
      }
    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  }

  async function getData(pageNum, limitNum) {
    let data = parseSearchParams(searchParams);
    data = Object.keys(data).length < 1 ? parseSearchParams(searchParams2) : data;
    data.id = data.id?.replace(ID_PREFIX.PROPERTY_SPACE, "");

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-spaces/PAGINATE",
        {
          where: [
            data
              ? `${data.id ? `ergo_property_spaces.id = '${data.id}'` : "1"} AND ${data.host_email ? `email LIKE '${data.host_email}'` : "1"} AND ${data.property_name ? `ergo_property.name LIKE '%${data.property_name}%'` : "1"} AND ${data.category_name ? `ergo_spaces.category LIKE '%${data.category_name}%' ` : "1"
              } AND ${data.status ? `ergo_property_spaces.availability LIKE '%${data.status}%'` : "1"} AND ${data.space_status ? `ergo_property_spaces.space_status LIKE '%${data.space_status}%'` : "1"
              } AND ${data.host_id ? `ergo_property.host_id = ${data.host_id}` : "1"} AND ${data.size != undefined ? `ergo_property_spaces.size = ${data.size}` : "1"} AND ${data.is_draft == 1 ? `ergo_property_spaces.draft_status < ${DRAFT_STATUS.COMPLETED}` : `ergo_property_spaces.draft_status = ${DRAFT_STATUS.COMPLETED}`
              }`
              : 1,
            "ergo_property_spaces.deleted_at IS NULL",
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
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  }

  const onSubmit = (data) => {
    searchParams.set("id", data.id);
    searchParams.set("host_id", data.host_id);
    searchParams.set("host_email", data.host_email);
    searchParams.set("property_name", data.property_name);
    searchParams.set("category_name", data.category_name);
    searchParams.set("status", data.status);
    searchParams.set("space_status", data.space_status);
    searchParams.set("size", data.size);
    searchParams.set("is_draft", data.is_draft);
    setSearchParams(searchParams);
    localStorage.setItem("admin_property_space_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces",
      },
    });

    (async function () {
      await fetchColumnOrder();
      await getData(1, pageSize);
      getSpacesData();
    })();
  }, []);

  React.useEffect(() => {
    if (state.deleted) {
      globalDispatch({
        type: "DELETED",
        payload: {
          deleted: false,
        },
      });
      getData(currentPage, pageSize);
    }
  }, [state.deleted]);

  async function fetchColumnOrder() {
    sdk.setTable("settings");
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload: { key_name: "admin_property_space_column_order" } }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_property_space));
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  return (
    <>
      <form
        className="rounded rounded-b-none bg-white p-5 shadow "
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Property Spaces Search</h4>
          <AddButton
            link={"/admin/add-property_spaces"}
            text="Add new Property Space"
          />
        </div>

        <div className="filter-form-holder mt-10 flex max-w-6xl flex-wrap">
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="id"
            >
              ID
            </label>
            <input
              type="number"
              placeholder="ID"
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
              Host ID
            </label>
            <input
              type="number"
              placeholder="Host ID"
              {...register("host_id")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.host_id?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="host_email"
            >
              Host Email
            </label>
            <input
              type="email"
              placeholder="Host Email"
              {...register("host_email")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.host_email?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.host_email?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="property_name"
            >
              Property
            </label>
            <input
              type="text"
              placeholder="Property Name"
              {...register("property_name")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.property_name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.property_name?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="space"
            >
              Space
            </label>
            <select
              className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white p-2 leading-tight text-gray-700 focus:outline-none ${errors.space_id?.message ? "border-red-500" : ""}`}
              {...register("category_name")}
            >
              <option value={""}>Select Space Category</option>
              {spaces.map((sp) => (
                <option
                  key={sp.id}
                  value={sp.category}
                >
                  {sp.category}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.category_name?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="size"
            >
              Size
            </label>
            <select
              className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.size?.message ? "border-red-500" : ""}`}
              {...register("size")}
            >
              <option value={""}>ALL</option>
              {["Small", "Medium", "Large", "X-Large"].map((sp, idx) => (
                <option
                  key={sp}
                  value={idx}
                >
                  {sp}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.size?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="is_draft"
            >
              Is draft
            </label>
            <select
              className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.is_draft?.message ? "border-red-500" : ""
                }`}
              {...register("is_draft")}
            >
              <option value={""}>ALL</option>
              {["NO", "YES"].map((sp, idx) => (
                <option
                  key={sp}
                  value={idx}
                >
                  {sp}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.is_draft?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">Visibility</label>
            <select
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("status")}
            >
              {selectStatus.map((option) => (
                <option
                  name="Status"
                  value={option.key}
                  key={option.key}
                  defaultValue="Select Visibility"
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500"></p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">Status</label>
            <select
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("space_status")}
            >
              {selectSpaceStatus.map((option) => (
                <option
                  name="space_status"
                  value={option.key}
                  key={option.key}
                  defaultValue="Select Status"
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500"></p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ category_name: "", space_status: "", id: "", host_id: "", property_name: "", status: "", size: "" });
            localStorage.removeItem("admin_property_space_filter");
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
        <Link
          to="/admin/column_order/property_space"
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

      <div className="overflow-x-auto rounded">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <Table
            columns={tableColumns}
            rows={data}
            profile={true}
            tableType={"property_spaces"}
            table1="property_spaces"
            deleteMessage="Are you sure you want to delete this Property Space?"
            deleteTitle="Confirm Delete"
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

export default AdminPropertySpacesListPage;
