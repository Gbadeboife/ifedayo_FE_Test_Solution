import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { clearSearchParams, getNonNullValue, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import Button from "@/components/Button";
import Table from "@/components/Table";
import PaginationHeader from "@/components/PaginationHeader";
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { useRef } from 'react';
import { ID_PREFIX } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";
import TreeSDK from "@/utils/TreeSDK";

let sdk = new MkdSDK();
let treeSdk = new TreeSDK();

const AdminAmenityListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch, state } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState([]);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams(localStorage.getItem("admin_amenity_filter") ?? "");
  const [spaceCategories, setSpaceCategories] = React.useState([]);
  const tableRef = useRef(null);

  const schema = yup.object({
    name: yup.string(),
  });
  const {
    reset,
    register,
    handleSubmit,
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
    data.id = data.id?.replace(ID_PREFIX.AMENITY_CATEGORY, "");

    try {
      let filter = ["ergo_amenity.deleted_at,is"];
      if (data.id) {
        filter.push(`ergo_amenity.id,eq,${data.id}`);
      }
      if (data.name) {
        filter.push(`name,cs,${data.name}`);
      }
      if (data.space_id) {
        filter.push(`space_id,eq,${data.space_id}`);
      }


      let result = await treeSdk.getPaginate("amenity", {
        filter,
        join: ["spaces|space_id"],
        page: pageNum || 1,
        size: limitNum,
        order: "update_at",
      });
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

  async function fetchSpaceCategories() {
    try {
      let filter = ["deleted_at,is"];
      const result = await treeSdk.getList("spaces", {
        filter,
        join: [],
      });
      if (Array.isArray(result.list)) {
        setSpaceCategories(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  const onSubmit = (data) => {
    searchParams.set("id", data.id);
    searchParams.set("name", data.name);
    searchParams.set("space_id", data.space_id);

    setSearchParams(searchParams);
    localStorage.setItem("admin_amenity_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "amenity",
      },
    });

    (async function () {
      await fetchColumnOrder();
      await fetchSpaceCategories();
      getData(1, pageSize);
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
    const payload = { key_name: "admin_amenity_categories_column_order" };
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_amenity_categories));
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
          <h4 className="text-2xl font-medium">Amenity Search</h4>
          <AddButton
            link={"/admin/add-amenity"}
            text="Add Amenity"
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
              htmlFor="name"
            >
              Name
            </label>
            <input
              placeholder="Name"
              {...register("name")}
              className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.name?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="space_id"
            >
              Space Category
            </label>
            <select
              {...register("space_id")}
              className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.space_id?.message ? "border-red-500" : ""
                }`}
            >
              <option value="">ALL</option>
              {spaceCategories.map((ctg) => (
                <option
                  key={ctg.id}
                  value={ctg.id}
                >
                  {ctg.category}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.space_id?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ name: "", id: "" });
            localStorage.removeItem("admin_amenity_filter");
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
          to="/admin/column_order/amenity_categories"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
        >
          Change Column Order
        </Link>{" "}
        <DownloadTableExcel
          filename="amenity_list"
          sheet="amenity_list"
          currentTableRef={tableRef.current}
        >
          <button className="export-btn">Export to xls</button>
        </DownloadTableExcel>
      </div>

      <div className="overflow-x-auto rounded">
        <div className="overflow-x-auto border-b border-gray-200 ">
          <Table
            ref={tableRef}
            columns={tableColumns}
            rows={data}
            emailActions
            tableType={"Amenity"}
            table1="amenity"
            profile={true}
            deleteMessage="Are you sure you want to delete this amenity?"
            deleteTitle="Confirm Delete"
            onSort={onSort}
            id="table-to-xls"
            showDelete={true}
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

export default AdminAmenityListPage;
