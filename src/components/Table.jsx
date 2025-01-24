import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "@/globalContext";
import moment from "moment";
import { IMAGE_STATUS } from "@/utils/constants";

const Table = ({
  columns,
  rows,
  actions,
  profile,
  tableType,
  type,
  table1,
  table2,
  deleteMessage,
  deleteTitle,
  showDelete = true,
  onSort,
  id,
  rejectImage,
  approveImage,
  setActivePicture,
  openPictureModal,
  baasDelete,
  emailActions,
}) => {
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const navigate = useNavigate();

  return (
    <table
      className="min-w-full divide-y divide-gray-200 border border-t-0 bg-white"
      id={id}
    >
      <thead className="cursor-pointer bg-gray-50">
        <tr className="cursor-pointer">
          {columns.map((column, index) => (
            <th
              key={index}
              scope="col"
              className="cursor-pointer whitespace-nowrap px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              onClick={() => onSort(column.accessor)}
            >
              {column.header}
              {column.isSorted}
              <span>{column.isSorted ? (column.isSortedDesc ? " ▼" : " ▲") : ""}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {rows?.length > 0 && rows.map((row, i) => {
          return (
            <tr
              className="py-2 text-sm"
              key={i}
            >
              {columns.map((cell, index) => {
                if (cell.accessor.split(",").length > 1) {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4"
                    >
                      {cell.accessor.split(",").map((accessor, i) => (
                        <span
                          key={i}
                          className={`mr-2 ${cell?.multiline ? "mb-1 block" : ""}`}
                        >
                          {row[accessor.trim()]}
                        </span>
                      ))}
                    </td>
                  );
                }
                if (cell.accessor === "" && emailActions) {
                  return (
                    <td
                      key={index}
                      className="gap-3 whitespace-nowrap px-6 py-4"
                    >
                      <button
                        className={`bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pr-4 font-bold text-transparent ${showDelete ? "border-r border-gray-200" : ""}`}
                        onClick={() => {
                          navigate(`/admin/edit-${tableType.toLowerCase()}/${row.id}`, {
                            state: row,
                          });
                        }}
                      >
                        Edit
                      </button>
                      {showDelete && (
                        <button
                          className="ml-2 px-1 text-[#667085]"
                          onClick={() => {
                            globalDispatch({
                              type: "SHOWMODAL",
                              payload: {
                                showModal: true,
                                modalShowTitle: deleteTitle,
                                modalShowMessage: deleteMessage,
                                modalBtnText: "Delete",
                                type: "Delete",
                                itemId: row.id,
                                table1: table1,
                                table2: table2,
                              },
                            });
                          }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        className={`ml-4 border-l border-gray-200 bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pl-4 font-bold text-transparent`}
                        onClick={() => {
                          navigate(`/admin/view-${tableType.toLowerCase()}/${row.id}`, {
                            state: row,
                          });
                        }}
                      >
                        View
                      </button>
                    </td>
                  );
                }
                if (cell.accessor === "" && profile && cell.viewProperty) {
                  return (
                    <td
                      key={index}
                      className="gap-3 whitespace-nowrap px-6 py-4"
                    >
                      <button
                        className={`bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pr-4 font-bold text-transparent ${showDelete ? "border-r border-gray-200" : ""}`}
                        onClick={() => {
                          navigate(`/${type === "host" ? 'host':'admin'}/edit-${tableType.toLowerCase()}/${row.id}`, {
                            state: row,
                          });
                        }}
                      >
                        Edit
                      </button>
                      {showDelete && (
                        <button
                          className="ml-2 px-1 text-[#667085]"
                          onClick={() => {
                            globalDispatch({
                              type: "SHOWMODAL",
                              payload: {
                                showModal: true,
                                modalShowTitle: deleteTitle,
                                modalShowMessage: deleteMessage,
                                modalBtnText: "Delete",
                                type: baasDelete ? "BaasDelete" : "Delete",
                                itemId: row.id,
                                table1: table1,
                                table2: table2,
                              },
                            });
                          }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        className={`ml-4 border-l border-gray-200 bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pl-4 font-bold text-transparent`}
                        onClick={() => {
                          navigate(`/admin/view-${tableType.toLowerCase()}/${row.id}`, {
                            state: row,
                          });
                        }}
                      >
                        View
                      </button>
                    </td>
                  );
                }

                if (cell.accessor === "" && actions) {
                  return (
                    <td
                      key={index}
                      className="gap-3 whitespace-nowrap px-6 py-4"
                    >
                      <button
                        className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                        onClick={() => {
                          setActivePicture(row.photo);
                          openPictureModal();
                        }}
                      >
                        View Picture
                      </button>
                      {row?.is_photo_approved == IMAGE_STATUS.IN_REVIEW ? (
                        <>
                          <button
                            className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                            onClick={() => rejectImage(row)}
                          >
                            Reject Photo
                          </button>
                          <button
                            className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                            onClick={() => approveImage(row.id)}
                          >
                            Approve Photo
                          </button>
                        </>
                      ) : row?.is_photo_approved === IMAGE_STATUS.APPROVED ? (
                        <button
                          className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                          onClick={() => rejectImage(row)}
                        >
                          Reject Photo
                        </button>
                      ) : (
                        <button
                          className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                          onClick={() => approveImage(row.id)}
                        >
                          Approve Photo
                        </button>
                      )}
                      <button
                        className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                        onClick={() => {
                          navigate(`/admin/view-${tableType.toLowerCase()}/${row.id}`, {
                            state: row,
                          });
                        }}
                      >
                        View Profile
                      </button>
                    </td>
                  );
                }
                if (cell.accessor === "" && profile) {
                  return (
                    <td
                      key={index}
                      className="gap-3 whitespace-nowrap px-6 py-4"
                    >
                      <button
                        className={`bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pr-4 font-bold text-transparent ${showDelete ? "border-r border-gray-200" : ""}`}
                        onClick={() => {
                          navigate(`${type === "host" ? 'host':'admin'}/edit-${tableType.toLowerCase()}/${row.id}`, {
                            state: row,
                          });
                        }}
                      >
                        Edit
                      </button>
                      {showDelete && (
                        <button
                          className="ml-2 px-1 text-[#667085]"
                          onClick={() => {
                            globalDispatch({
                              type: "SHOWMODAL",
                              payload: {
                                showModal: true,
                                modalShowTitle: deleteTitle,
                                modalShowMessage: deleteMessage,
                                modalBtnText: "Delete",
                                type: baasDelete ? "BaasDelete" : "Delete",
                                itemId: row.id,
                                table1: table1,
                                table2: table2,
                              },
                            });
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  );
                }

                if (cell.accessor == "image" || cell.accessor == "photo_url") {
                  return (
                    <td
                      key={index}
                      className="max-h-[80px] whitespace-nowrap px-6 py-2"
                    >
                      <img
                        src={row[cell.accessor]}
                        className="h-16 "
                        alt="image"
                      />
                    </td>
                  );
                }
                if (cell.accessor == "icon") {
                  return (
                    <td
                      key={index}
                      className="max-h-[80px] whitespace-nowrap object-cover px-6 py-2"
                    >
                      <img
                        src={row[cell.accessor]}
                        className="h-16 "
                        alt="icon"
                      />
                    </td>
                  );
                }
                if (cell.statusMapping) {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4"
                    >
                      <span className={`${row[cell.accessor] === 1 ? "text-black" : "text-[#98A2B3]"} rounded-full border border-[#EAECF0] bg-[#F9FAFB] py-[2px] px-[10px]`}>
                        {" "}
                        {cell.statusMapping[row[cell.accessor]]}
                      </span>
                    </td>
                  );
                }
                if (cell.mapping) {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4"
                    >
                      {cell.mapping[row[cell.accessor]] ?? "N/A"}
                    </td>
                  );
                }

                if (cell.accessor == "dob") {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4"
                    >
                      {row[cell.accessor] ? moment(row[cell.accessor]).format("MM/DD/YY") : ""}
                    </td>
                  );
                }
                if (cell.accessor?.includes("email")) {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4 normal-case"
                    >
                      {row[cell.accessor]}
                    </td>
                  );
                }
                if (cell.accessor == "num_properties") {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4 normal-case "
                    >
                      <button
                        className="border-r border-gray-200 bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pr-2 font-bold text-transparent"
                        onClick={() => {
                          navigate(`/admin/property_spaces?host_id=${row.id}`);
                        }}
                      >
                        View
                      </button>
                      {/* <span className="ml-2"> {row[cell.accessor]}</span> */}
                    </td>
                  );
                }
                if (cell.accessor.includes("payout") || cell.amountField) {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4 normal-case "
                    >
                      <span className="ml-2">&#36;{(row[cell.accessor] ? row[cell.accessor] : 0).toFixed(2)}</span>
                    </td>
                  );
                }
                if (cell.formatDate) {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4 normal-case "
                    >
                      <span className="ml-2">{new Date(row[cell.accessor]).toUTCString()}</span>
                    </td>
                  );
                }

                if (cell.nested) {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4 normal-case"
                    >
                      {row[cell.nested][cell.accessor]}
                    </td>
                  );
                }

                if (cell.idPrefix) {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4 normal-case"
                    >
                      {cell.idPrefix + row[cell.accessor]}
                    </td>
                  );
                }

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
                if (cell.accessor === "cost") {
                  return (
                    <td
                      key={index}
                      className="whitespace-nowrap px-6 py-4"
                    >
                      ${row[cell.accessor]}
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
  );
};

export default Table;
