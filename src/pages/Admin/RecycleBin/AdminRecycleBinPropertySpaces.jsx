import React, { useContext, useState } from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import Button from "@/components/Button";
import SwitchBulkMode from "@/components/SwitchBulkMode";
import moment from "moment";
import TreeSDK from "@/utils/TreeSDK";
import { ID_PREFIX } from "@/utils/constants";
import RestoreModal from "./RestoreModal";
import DeletePermanentlyModal from "./DeletePermanentlyModal";
import RestoreAllModal from "./RestoreAllModal";
import { Switch } from "@headlessui/react";

let treeSdk = new TreeSDK()

const columns = [
  {
    header: "ID",
    accessor: "id",
    isSorted: true,
    isSortedDesc: true,
    idPrefix: true,
  },

  {
    header: "Email",
    nested: "user",
    accessor: "email",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Deleted At",
    accessor: "deleted_at",
    isSorted: true,
    isSortedDesc: true,
    format: (raw) => moment(raw).format("MM/DD/yyyy hh:mm:ss A"),
  },
  {
    header: "Actions",
    accessor: "",
  },
];



export default function AdminRecycleBinPropertySpaces() {
  const { dispatch } = React.useContext(AuthContext);
  const { state: globalState, dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [bulkMode, setBulkMode] = React.useState(false);
  const [bulkSelected, setBulkSelected] = React.useState([]);
  const [searchParams, setSearchParams] = useSearchParams(localStorage.getItem("admin_recycle_filter") ?? "");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRestore, setSelectedRestore] = useState({});
  const [selectedDelete, setSelectedDelete] = useState({});
  const [restoreAll, setRestoreAll] = useState(false);

  let sdk = new MkdSDK();
  let tdk = new TreeSDK();

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: parseSearchParams(searchParams),
  });

  async function getData(data) {
    setLoading(true);
    try {

      let filter = ["ergo_property_spaces.deleted_at IS NOT NULL"];
      if (data?.id) {
        filter.push(`ergo_property_spaces.id = ${data?.id}`);
      }
      if (data?.deleted_at) {
        filter[0] = (`DATE_FORMAT(ergo_property_spaces.deleted_at, '%Y-%m-%d')= '${data?.deleted_at}'`);

      }
      if (data?.email) {
        filter.push(`ergo_property_spaces.email LIKE '${data?.email}'`);
      }
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/property-spaces/PAGINATE",
        {
          "where": filter,
          "page": 1,
          "limit": 10
        },
        "POST"
      )
      setData(result.list);

    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
    setLoading(false);
  }

  function MyToggle(data) {
    const [enabled, setEnabled] = useState(data.user.status === 1 ? true : false)
    const { dispatch: globalDispatch } = useContext(GlobalContext);

    let sdk = new MkdSDK();
    async function editUser() {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/soft-delete", { id: Number(data.user.id), entity: "user", type: "restore" }, "POST");
      if (!result.error) {
        showToast(globalDispatch, result.message, 4000)
        getData()
      }
    }


    return (
      <Switch
        checked={enabled}
        onChange={() => editUser()}
        className={`${enabled ? "!bg-gradient-to-r from-primary-dark to-primary-dark" : "bg-gray-300"}
        relative inline-flex h-[28px] w-[55px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className={`${enabled ? "translate-x-7" : "translate-x-0"}
          pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    )
  }

  const onSubmit = (data) => {
    searchParams.set("id", data.id);
    searchParams.set("deleted_at", data.deleted_at);
    searchParams.set("email", data.email);
    setSearchParams(searchParams);
    localStorage.setItem("admin_recycle_filter", searchParams.toString());

    getData(data);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "recycle_bin_properties_spaces`",
      },
    });
    getData();
  }, []);

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="max-w-5xl">
          <div className="flex justify-between">
            <h4 className="text-2xl font-medium">Recycle Bin (Property Spaces)</h4>
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
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.id?.message}</p>
            </div>

            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="email"
              >
                Email
              </label>
              <input
                {...register("email")}
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.email?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.email?.message}</p>
            </div>

            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="deleted_at"
              >
                Date Deleted
              </label>
              <input
                type={"date"}
                {...register("deleted_at")}
                className="none mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              />
              <p className="text-xs italic text-red-500">{errors.deleted_at?.message}</p>
            </div>
          </div>
          <Button text="Search" />
          <button
            className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
            type="reset"
            onClick={() => {
              reset({ id: "", entity_type: "", deleted_at: "", email: "" });
              localStorage.removeItem("admin_recycle_filter");
              clearSearchParams(searchParams, setSearchParams);
              getData();
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="flex justify-end bg-white px-6 pt-4">
        <SwitchBulkMode
          enabled={bulkMode}
          setEnabled={setBulkMode}
        />
      </div>

      {bulkMode && (
        <div className="flex items-center justify-between bg-white py-4 pl-2 pr-6 font-medium text-[#667085]">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="bulk-mode"
              id=""
              onClick={() => {
                if (bulkSelected.length != data.length) {
                  setBulkSelected(data.map((row) => ({ id: row.id, table: row.entity_type })));
                } else {
                  setBulkSelected([]);
                }
              }}
              checked={bulkSelected.length == data.length && data.length > 0}
              onChange={() => { }}
            />
            Select All
          </label>
          {bulkSelected.length > 0 ? (
            <div className="flex items-start gap-4">
              {" "}
              <button
                onClick={() => {
                  showToast(globalDispatch, "Working on it", 4000, "ERROR");
                }}
              >
                Delete All
              </button>
              <button onClick={() => setRestoreAll(true)}>Restore All</button>
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          {loading ? (
            <div className="flex items-center justify-center py-12">Loading...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 border border-t-0 bg-white">
              <thead className="cursor-pointer bg-gray-50">
                <tr className="cursor-pointer">
                  {bulkMode && (
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    ></th>
                  )}
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="cursor-pointer whitespace-nowrap px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {column.header}
                      {column.isSorted}
                      <span>{column.isSorted ? (column.isSortedDesc ? " ▼" : " ▲") : ""}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 normal-case">
                {data
                  .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at))
                  .map((row, i) => {
                    return (
                      <tr
                        className="py-2 text-sm"
                        key={i}
                      >
                        {bulkMode && (
                          <td className="whitespace-nowrap px-2 py-2">
                            <input
                              type="checkbox"
                              name="bulk-mode"
                              id=""
                              onClick={() => {
                                if (bulkSelected.some((item) => item.id == row.id)) {
                                  setBulkSelected((prev) => {
                                    let copy = [...prev];
                                    copy.splice(
                                      prev.findIndex((item) => item.id == row.id),
                                      1,
                                    );
                                    return copy;
                                  });
                                } else {
                                  setBulkSelected((prev) => [...prev, { id: row.id, table: row.entity_type }]);
                                }
                              }}
                              checked={bulkSelected.some((item) => item.id == row.id)}
                              onChange={() => { }}
                            />
                          </td>
                        )}
                        {columns.map((cell, index) => {
                          if (cell.format) {
                            return (
                              <td
                                key={index}
                                className="whitespace-nowrap px-6 py-4"
                              >
                                {cell.format(row[cell.accessor])}
                              </td>
                            );
                          }
                          if (cell.accessor == "") {
                            return (
                              <td
                                key={index}
                                className="gap-3 whitespace-nowrap flex items-center px-6 py-4"
                              >
                                {(row.email) &&
                                  <div className="w-fit border-r border-gray-200 pr-4 text-[#667085]">
                                    <MyToggle user={row} />
                                  </div>
                                }
                                {(!row.email) &&
                                  <button
                                    className="w-fit border-r border-gray-200 pr-4 text-[#667085]"
                                    onClick={() => setSelectedRestore(row)}
                                  >
                                    Restore
                                  </button>
                                }
                                <button
                                  className="w-fit border-r border-gray-200 pr-4 text-[#667085]"
                                  onClick={() => setSelectedDelete(row)}
                                >
                                  Delete Permanently
                                </button>
                              </td>
                            );
                          }
                          if (cell.mapping) {
                            return (
                              <td
                                key={index}
                                className="whitespace-nowrap px-6 py-4"
                              >
                                {cell.mapping[row[cell.accessor]]}
                              </td>
                            );
                          }


                          return (
                            <td
                              key={index}
                              className="whitespace-nowrap px-6 py-4"
                            >
                              {row[cell.accessor]}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <RestoreModal
        modalOpen={selectedRestore.id != undefined}
        closeModal={() => setSelectedRestore({})}
        data={selectedRestore}
        onSuccess={() => getData()}
      />
      <RestoreAllModal
        modalOpen={restoreAll}
        closeModal={() => setRestoreAll(false)}
        records={bulkSelected}
        onSuccess={() => {
          setBulkSelected([]);
          getData();
        }}
      />
      <DeletePermanentlyModal
        modalOpen={selectedDelete.id != undefined}
        closeModal={() => setSelectedDelete({})}
        data={selectedDelete}
        onSuccess={() => getData()}
        table="property_spaces"
      />
    </>
  );
}
