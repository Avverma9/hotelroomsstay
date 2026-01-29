import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import baseURL from "../../utils/baseURL";

export default function PartnerFoods() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info", // info, success, warning, error
  });
  const hotelId = localStorage.getItem("hotelId");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification("Please select a valid image file.", "error");
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image size should be less than 5MB.", "error");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!imageFile) {
      showNotification("Please upload a food image.", "warning");
      return;
    }

    if (parseFloat(price) <= 0) {
      showNotification("Please enter a valid price.", "warning");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("hotelId", hotelId);
      formData.append("name", name);
      formData.append("about", about);
      formData.append("images", imageFile);
      formData.append("price", price);

      const response = await axios.post(
        `${baseURL}/add/food-to/your-hotel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        showNotification("Your food has been added!", "success");
        setTimeout(() => {
          navigate("/partner/last-step");
        }, 1500);
      } else {
        showNotification("Failed to add food. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error adding food:", error);
      showNotification("An error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "info" });
    }, 6000);
  };

  // Custom SVG Icons
  const PhotoCameraIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89L8.935 4.5A2 2 0 0110.599 3.5h2.802a2 2 0 011.664.89L16.406 6.1a2 2 0 001.664.89H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const UploadIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const RestaurantIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const ExclamationIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.008 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );

  // Notification Component
  const Notification = () => {
    if (!notification.show) return null;

    const getNotificationStyles = () => {
      const baseStyles = "fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-lg shadow-lg border z-50 flex items-center space-x-3 max-w-md w-full mx-4";
      
      switch (notification.type) {
        case "success":
          return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
        case "error":
          return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
        case "warning":
          return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
        default:
          return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      }
    };

    const getIcon = () => {
      switch (notification.type) {
        case "success":
          return <CheckIcon />;
        case "error":
          return <CloseIcon />;
        case "warning":
          return <ExclamationIcon />;
        default:
          return <span className="text-blue-600 font-bold">i</span>;
      }
    };

    return (
      <div className={getNotificationStyles()}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <p className="text-sm font-medium">{notification.message}</p>
        <button
          onClick={() => setNotification({ show: false, message: "", type: "info" })}
          className="ml-auto flex-shrink-0 hover:opacity-70"
        >
          <CloseIcon />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-4 px-4 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Add Food Items 🍽️
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              Manage food items for your hotel. Add delicious food items to enhance your guests' dining experience and increase revenue.
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 h-2 rounded-full w-4/5"></div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">Additional Services Setup 4 of 5</p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              <RestaurantIcon />
              <span className="ml-3">Food Item Details</span>
            </h2>
            <p className="text-orange-100 text-sm mt-1">Add mouth-watering dishes to your menu</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {/* Food Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Food Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 text-sm"
                  placeholder="e.g., Chicken Biryani, Margherita Pizza..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* About the Food */}
              <div className="space-y-2">
                <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                  About the Food *
                </label>
                <textarea
                  id="about"
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 text-sm resize-none"
                  placeholder="Describe the ingredients, preparation method, taste, and what makes this dish special..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (₹ INR) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 text-sm"
                    placeholder="Enter price in rupees"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Food Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors duration-200">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Food Preview"
                          className="w-full max-w-xs h-48 object-cover rounded-lg shadow-md"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm opacity-0 hover:opacity-100 transition-opacity duration-200">Click to change</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <PhotoCameraIcon />
                      <div>
                        <p className="text-gray-600 font-medium">Upload a delicious food image</p>
                        <p className="text-gray-400 text-sm mt-1">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg shadow-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 cursor-pointer"
                    >
                      <UploadIcon />
                      <span className="ml-2">
                        {imagePreview ? "Change Image" : "Upload Image"}
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-8 border-t border-gray-200 mt-8">
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
               
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full sm:w-auto px-12 py-3 font-bold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 ${
                    isLoading
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Adding Food...</span>
                      </>
                    ) : (
                      <>
                        <span>Add to Menu</span>
                        <span className="ml-2">🍽️</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Tips for Great Food Listings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">📸 Image Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use high-quality, well-lit photos</li>
                <li>• Show the complete dish</li>
                <li>• Use natural lighting when possible</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">📝 Description Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mention key ingredients</li>
                <li>• Highlight unique flavors</li>
                <li>• Note dietary information (veg/non-veg)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      <Notification />
    </div>
  );
}

