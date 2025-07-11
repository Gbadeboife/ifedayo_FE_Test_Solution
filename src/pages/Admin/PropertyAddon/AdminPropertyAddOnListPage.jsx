import React from "react";
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
import Table from "@/components/Table";
import PaginationHeader from "@/components/PaginationHeader";
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { useRef } from 'react';
import { ID_PREFIX } from "@/utils/constants";

let sdk = new MkdSDK();

const columns = [
  {
    header: "ID",
    accessor: "id",
    isSorted: true,
    isSortedDesc: true,
    idPrefix: ID_PREFIX.PROPERTY_ADDON,
  },
  {
    header: "Property",
    accessor: "property_name",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Add-on name",
    accessor: "add_on_name",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Cost",
    accessor: "cost",
    isSorted: true,
    isSortedDesc: true,
    amountField: true,
  },
  {
    header: "Actions",
    accessor: "",
  },
];

const AdminPropertyAddOnListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch, state } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState(columns);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);

  const [addOns, setAddOns] = React.useState([]);
  const [searchParams, setSearchParams] = useSearchParams(localStorage.getItem("admin_property_addon_filter") ?? "");

  const navigate = useNavigate();

  const schema = yup.object({
    property_name: yup.string(),
    addon_name: yup.string(),
    id: yup.string(),
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
    data.id = data.id?.replace(ID_PREFIX.PROPERTY_ADDON, "");

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-addons/PAGINATE",
        {
          where: [
            data
              ? `${data.id ? `ergo_property_add_on.id = '${data.id}'` : "1"} 
              AND  ${data.property_name ? `ergo_property.name LIKE '%${data.property_name}%'` : "1"} 
              AND ${data.addon_name ? `ergo_add_on.name LIKE '%${data.addon_name}%'` : "1"} AND ${data.property_id ? `ergo_property.id = ${data.property_id}` : "1"}`
              : 1,
            "ergo_property_add_on.deleted_at IS NULL",
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
    searchParams.set("property_name", data.property_name);
    searchParams.set("addon_name", data.addon_name);
    setSearchParams(searchParams);
    localStorage.setItem("admin_property_addon_filter", searchParams.toString());

    getData(1, pageSize);
  };

  const getAllAddOns = async () => {
    try {
      sdk.setTable("add_on");
      const result = await sdk.callRestAPI({}, "GETALL");
      if (!result.error) {
        setAddOns(result.list);
      }
    } catch (error) {
      console.log("Error", error);
      setError("add_on_id", {
        type: "manual",
        message: error.message,
      });
      tokenExpireError(dispatch, error.message);
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_add_on",
      },
    });
    getAllAddOns();
    getData(1, pageSize);
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

  const tableRef = useRef(null);

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Property Add-on Search</h4>
          <AddButton
            link={"/admin/add-property_add_on"}
            text="Add New Property Add-on"
          />
        </div>

        <div className="filter-form-holder mt-10 flex max-w-2xl flex-wrap">
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
              htmlFor="property_name"
            >
              Property
            </label>
            <input
              placeholder="Property"
              {...register("property_name")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.property_name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.property_name?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="addon_name"
            >
              Add-on
            </label>
            <select
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("addon_name")}
            >
              <option value="">Select Option</option>
              {addOns.map((option) => (
                <option key={option.id}>{option?.name}</option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.addon_name?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ id: "", property_name: "", add_on_name: "", property_id: "" });
            localStorage.removeItem("admin_property_addon_filter");
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
        <DownloadTableExcel
          filename="property_addon_list"
          sheet="property_addon_list"
          currentTableRef={tableRef.current}
        >
          <button className="export-btn">Export to xls</button>
        </DownloadTableExcel>
      </div>

      <div className="overflow-x-auto rounded bg-white">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <Table
            ref={tableRef}
            columns={tableColumns}
            rows={data}
            tableType={"property_add_on"}
            table1="property_add_on"
            profile={true}
            deleteMessage="Are you sure you want to delete this Property Add-on?"
            deleteTitle="Confirm Delete"
            baasDelete={true}
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

export default AdminPropertyAddOnListPage;
