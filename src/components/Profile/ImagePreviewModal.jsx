import React, { useState } from "react";

export default function ImagePreviewModal({ isOpen, closeModal, selectedFile, onConfirm, loading }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  React.useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  const handleConfirm = () => {
    onConfirm(selectedFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={closeModal}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Preview Profile Picture
          </h3>
          
          {previewUrl && (
            <div className="mb-6">
              <img
                src={previewUrl}
                alt="Profile preview"
                className="mx-auto rounded-full object-cover w-32 h-32 border-4 border-gray-200"
              />
              <p className="text-sm text-gray-500 mt-2">
                {selectedFile?.name}
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 mb-6">
            This is how your profile picture will look. Would you like to proceed with this image?
          </p>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={closeModal}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Use This Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 