import useAddonCategories from "@/hooks/api/useAddonCategories";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { LoadingButton } from "@/components/frontend";

export default function EditAddonsModal({ modalOpen, category, closeModal, propertyAddons, id, property_id, forceRender }) {
  const addons = useAddonCategories(id, category == "Others");
  const [loading, setLoading] = useState(false)
  const schema = yup
  .object({
    name: yup.string()
  })
  .required();

  const {
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  let prop_addons = propertyAddons;

  let ids = prop_addons.map(obj => Number(obj.add_on_id))
  const sdk = new MkdSDK();

  async function addOrRemoveAddon(event) {
    const checkbox = event.target;
    const id = parseInt(checkbox.value);

    if (checkbox.checked) {
      // If the checkbox is checked, add the ID to the array if it doesn't exist
      if (!ids.includes(id)) {
        ids.push(id);
      }
    } else {
      // If the checkbox is unchecked, remove the ID from the array if it exists
      const index = ids.indexOf(id);
      if (index !== -1) {
        ids.splice(index, 1);
      }
    }
    }

    const fetchSelectedAddons = () => {
      const selectedCheckboxes = document.querySelectorAll('.addon-checkbox:checked');
      const selectedIds = Array.from(selectedCheckboxes).map(checkbox => parseInt(checkbox.value));
      return selectedIds;
    };
    
    function arraysHaveSameContent(arr1, arr2) {
      // If the arrays have different lengths, they can't be the same
    if (arr1.length !== arr2.length) {
      return false;
    }

    // Sort both arrays
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();

    // Compare the sorted arrays as strings
    return JSON.stringify(sortedArr1) === JSON.stringify(sortedArr2);
  }

  function findArrayDifferences(arr1, arr2) {
    // Find elements in arr2 that are not in arr1
    const toAdd = arr2.filter(item => !arr1.includes(item));
    // Find elements in arr1 that are not in arr2
    const toRemove = arr1.filter(item => !arr2.includes(item));

    return { toAdd, toRemove };
  }

  async function updateAddons() {
    setLoading(true);
    // edit property
    sdk.setTable("property_add_on");
    const data = prop_addons.map(obj => Number(obj.add_on_id))
    const selectedAddonsIds = fetchSelectedAddons();

    if (arraysHaveSameContent(data, selectedAddonsIds)) {
      setLoading(false);
      closeModal()
      return;
      }
      else {
      const { toAdd, toRemove } = findArrayDifferences(data, selectedAddonsIds);
      
      for (const addonId of toRemove) {
        const addon = prop_addons.find((p_am) => p_am.add_on_id === addonId);
        if (addon) {
          await sdk.callRestAPI({ id: Number(addon.id) }, "DELETE");
        }
      }

      for (const addonId of toAdd) {
        await sdk.callRestAPI(
          {
            property_id,
            add_on_id: Number(addonId),
          },
          "POST"
        );
      }

      setLoading(false);
      closeModal();
      forceRender(); // Force re-render to reflect changes

      //   findArrayDifferences(data, ids)
      //   const diff = findArrayDifferences(data, ids)
      //   const diff2 = findArrayReverseDifferences(ids, data)

      // if (diff.length > 0) {
      //   for (let i = 0; i < diff.length; i++) {
      //     const am_ = diff[i];
      //     const am_id = prop_addons?.find((p_am) => p_am.add_on_id === am_)
      //     if (am_id !== undefined) {
      //       await sdk.callRestAPI(
      //         {
      //           id: Number(am_id?.id),
      //         },
      //         "DELETE",
      //       );

      //       prop_addons.filter((ad) => Number(ad.add_on_id) !== Number(am_))
      //       }
      //       for (let i = 0; i < prop_addons.length; i++) {
      //         if (prop_addons[i].add_on_id === Number(am_)) {
      //           prop_addons.splice(i, 1);
      //             break; // Assuming there's only one object with add_on_id 37
      //         }
      //     }
          
      //     }
      //       }

      //       if (diff2.length > 0) {
      //         for (let i = 0; i < diff2.length; i++) {
      //           const am_ = diff2[i];
      //           const added_add_on = addons.find((add_on) => Number(add_on.id) == Number(am_))
      //           prop_addons.push(added_add_on)
      //           await sdk.callRestAPI(
      //             {
      //               property_id,
      //               add_on_id: Number(am_),
      //               },
      //               "POST",
      //               );
      //               }
      //               }

      // setLoading(false);
      // closeModal()
    }
  }

  return (
    <>
      <Transition
        appear
        show={modalOpen}
        as={Fragment}
      >
        <Dialog
          as="div"
          className="relative z-10"
          onClose={closeModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <form 
            onSubmit={handleSubmit(updateAddons)}
            className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  as="div"
                  className="w-full max-w-md mt-10 transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                >
                <Dialog.Title
                    as="h3"
                    className="text-lg mb-8 font-medium leading-6 text-gray-900 flex w-full justify-between items-center"
                  >
                    {" "}
                    {" "}
                    <span>Addons</span>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="py-2 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full flex justify-end"
                    >
                      &#x2715;
                    </button>
                  </Dialog.Title> 
                  {addons.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((ad, id) => (
                    <div
                      key={ad.id}
                      className="checkbox-container mb-4"
                    >
                      <input
                        type="checkbox"
                        name="addons"
                        id={"addon" + ad.id}
                        className="addon-checkbox"
                        value={ad.id}
                        defaultChecked={prop_addons.find(e => e.add_on_id === ad.id)}
                        onChange={(e) => addOrRemoveAddon(e)}
                      />
                      <label htmlFor={"addon" + ad.id}>{ad.name}</label>
                    </div>
                  ))}
                    <div className="flex justify-between">
                    <button
                    disabled={loading}
                    type="button"
                    onClick={closeModal}
                      className="mb-1 flex-1 rounded border border-[#667085] !bg-gradient-to-r px-6 py-2 text-sm font-semibold text-[#667085] outline-none focus:outline-none"
                    >
                      Cancel
                    </button>

                    <LoadingButton
                    loading={loading}
                    type="submit"
                    className={`ml-5 mb-1 flex-1 rounded !bg-gradient-to-r from-[#33D4B7]  to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"}`}>
                      Update
                    </LoadingButton>
                    </div>
                </Dialog.Panel>
              </Transition.Child>
            </form>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
