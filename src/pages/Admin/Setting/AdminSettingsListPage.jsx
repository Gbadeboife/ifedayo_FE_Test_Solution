import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { createSearchParams, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import PaginationHeader from "@/components/PaginationHeader";
import Table from "@/components/Table";
import Button from "@/components/Button";
import { ID_PREFIX } from "@/utils/constants";

let sdk = new MkdSDK();

const columns = [
  {
    header: "ID",
    accessor: "id",
    isSorted: true,
    isSortedDesc: true,
    idPrefix: ID_PREFIX.SETTING,
  },
  {
    header: "Key Name",
    accessor: "key_name",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Key Value",
    accessor: "key_value",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Actions",
    accessor: "",
  },
];

const AdminSettingsListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState(columns);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const schema = yup.object({
    id: yup.string(),
    key_name: yup.string(),
  });
  const {
    reset,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
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
    try {
      sdk.setTable("settings");
      const payload = { id: data.id || undefined, key_name: data.key_name || undefined };
      const result = await sdk.callRestAPI(
        {
          payload,
          page: pageNum,
          limit: limitNum,
        },
        "PAGINATE",
      );

      const { list, total, limit, num_pages, page } = result;
      const sortedList = selector(
        list.filter((stg) => stg.key_value),
        false,
      );
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
    data.id = data.id.replace(ID_PREFIX.SETTING, "");
    let id = data.id ?? undefined;
    let key_name = data.key_name ?? undefined;
    setSearchParams(
      createSearchParams({
        id,
        key_name: key_name,
      }),
    );
    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "settings",
      },
    });

    getData(1, pageSize);
  }, []);

  return (
    <>
      <form
        className="p-5 bg-white shadow rounded"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Settings</h4>
          <AddButton
            link={"/admin/add-settings"}
            text="Add New Setting"
          />
        </div>
        <div className="filter-form-holder mt-10 flex flex-wrap max-w-4xl">
          <div className="mb-4 w-full md:w-1/2 pr-2 pl-2">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="id"
            >
              ID
            </label>
            <input
              placeholder="ID"
              {...register("id")}
              className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-red-500 text-xs italic">{errors.id?.message}</p>
          </div>

          <div className="mb-4 w-full md:w-1/2 pr-2 pl-2">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="key_name"
            >
              Key Name
            </label>
            <input
              placeholder="Key Name"
              {...register("key_name")}
              className={`"shadow   border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.key_name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-red-500 text-xs italic">{errors.key_name?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="ml-2 cursor-pointer rounded-md font-inter px-[66px] py-[10px] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text text-transparent border border-[#33D4B7]"
          type="reset"
          onClick={() => {
            reset({ id: "", key_name: "" });
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

      <div className="overflow-x-auto bg-white shadow rounded">
        <div className="overflow-x-auto border-b border-gray-200">
          <Table
            columns={tableColumns}
            rows={data}
            profile={true}
            tableType={"settings"}
            table1="settings"
            deleteMessage="Are you sure you want to delete this setting?"
            showDelete={false}
            onSort={onSort}
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

export default AdminSettingsListPage;
