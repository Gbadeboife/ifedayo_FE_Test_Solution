import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import useAmenityCategories from "@/hooks/api/useAmenityCategories";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { LoadingButton } from "@/components/frontend";

export default function EditAmenitiesModal({ modalOpen, category, closeModal, propertyAmenities, id, oldAm, p_id, idAm, forceRender }) {
  const amenities = useAmenityCategories(id, category == "Others");
  const [loading, setLoading] = useState(false);
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

  let propAmenities = propertyAmenities;
  let ids = idAm;

  const sdk = new MkdSDK();

  async function addOrRemoveAmenity(event) {
    const checkbox = event.target;
    const id = parseInt(checkbox.value);
    if (checkbox.checked) {

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

  const fetchSelectedAmenities = () => {
    const selectedCheckboxes = document.querySelectorAll('.amenity-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(checkbox => parseInt(checkbox.value));
    return selectedIds;
  };

  function arraysHaveSameContent(arr1, arr2) {
    // If the arrays have different lengths, they can't be the same
    if (arr1.length !== arr2.length) {
      return false;
    }

    // Compare the sorted arrays as strings
    return JSON.stringify(arr1.slice().sort()) === JSON.stringify(arr2.slice().sort());
  }

  function findArrayDifferences(arr1, arr2) {
    // Find elements in arr2 that are not in arr1
    const toAdd = arr2.filter(item => !arr1.includes(item));
    // Find elements in arr1 that are not in arr2
    const toRemove = arr1.filter(item => !arr2.includes(item));

    return { toAdd, toRemove };
  }

  async function updateAmenities() {
    setLoading(true);
    // edit property
    sdk.setTable("property_spaces_amenitites");
    const data = propAmenities.map(obj => Number(obj.amenity_id));
    const selectedAmenityIds = fetchSelectedAmenities();

    if (arraysHaveSameContent(data, selectedAmenityIds)) {
      setLoading(false);
      closeModal();
      return;
    } else {
      const { toAdd, toRemove } = findArrayDifferences(data, selectedAmenityIds);
      
      for (const amenityId of toRemove) {
        const amenity = propAmenities.find((p_am) => p_am.amenity_id === amenityId);
        if (amenity) {
          await sdk.callRestAPI({ id: Number(amenity.id) }, "DELETE");
        }
      }

      for (const amenityId of toAdd) {
        await sdk.callRestAPI(
          {
            property_spaces_id: p_id,
            amenity_id: Number(amenityId),
          },
          "POST"
        );
      }

      setLoading(false);
      closeModal();
      forceRender(); // Force re-render to reflect changes
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
              onSubmit={handleSubmit(updateAmenities)}
              className="flex min-h-full items-center justify-center p-4 text-center"
            >
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
                  className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                >
                  <Dialog.Title
                    as="h3"
                    className="text-lg mb-8 font-medium leading-6 text-gray-900 flex w-full justify-between items-center"
                  >
                    {" "}
                    <span>Amenities</span>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="py-2 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full flex justify-end"
                    >
                      &#x2715;
                    </button>
                  </Dialog.Title>
                  {amenities.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((am) => (
                    <div
                      key={am.id}
                      className="checkbox-container mb-4"
                    >
                      <input
                        type="checkbox"
                        name="amenities"
                        id={"amenity" + am.id}
                        className="amenity-checkbox"
                        value={am.id}
                        defaultChecked={propAmenities.find(e => e.amenity_id === am.id)}
                        onChange={(e) => addOrRemoveAmenity(e)}
                      />
                      <label htmlFor={"amenity" + am.id}>{am.name}</label>
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
                      className={`ml-5 mb-1 flex-1 rounded !bg-gradient-to-r from-[#33D4B7]  to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"}`}
                    >
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
