import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import baseURL from "../../utils/baseURL";
import { amenitiesList } from "../../utils/extrasList";

export default function AmenitiesPage () {
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info", // info, success, warning, error
  });
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const hotelId = localStorage.getItem("hotelId");

  const handleToggleAmenity = (amenityName) => {
    setSelectedAmenities((prev) => {
      if (prev.includes(amenityName)) {
        return prev.filter((item) => item !== amenityName);
      } else {
        return [...prev, amenityName];
      }
    });
  };

  const removeAmenity = (amenityName) => {
    setSelectedAmenities((prev) => prev.filter((item) => item !== amenityName));
  };

  const sendAmenitiesToAPI = async () => {
    if (selectedAmenities.length === 0) {
      showNotification("Please select at least one amenity.", "warning");
      return;
    }

    const isConfirmed = window.confirm(
      "Before submitting, have you checked all details? Do you want to submit?"
    );

    if (!isConfirmed) {
      return;
    }

    setIsLoading(true);
    const apiEndpoint = `${baseURL}/create-a-amenities/to-your-hotel`;

    try {
      const response = await axios.post(apiEndpoint, {
        hotelId,
        amenities: selectedAmenities,
      });

      if (response.status === 201) {
        showNotification("Amenities submitted successfully!", "success");
        setTimeout(() => {
          window.location.href = "/partner/fourth-step";
        }, 1500);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Error sending amenities to API:", error);
      showNotification("Submission failed. Please try again.", "error");
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

  const filteredAmenities = amenitiesList.filter((amenity) =>
    amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Custom SVG Icons
  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const StarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
          return <span className="text-yellow-600 font-bold">!</span>;
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-4 px-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Hotel Amenities & Facilities ✨
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto">
              You've come so far! Select all the amenities and facilities your hotel offers. 
              This helps guests understand what to expect during their stay.
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full w-3/5"></div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">Third Step - Step 3 of 5</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              <StarIcon />
              <span className="ml-3">Select Your Amenities</span>
            </h2>
            <p className="text-purple-100 text-sm mt-1">Choose all facilities and services you provide</p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Search Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 pb-3 border-b-2 border-purple-100">
                🔍 Search Amenities
              </h3>
              <div className="max-w-md mx-auto relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-sm"
                  placeholder="Search for amenities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Found {filteredAmenities.length} amenities matching "{searchQuery}"
                </p>
              )}
            </div>

            {/* Amenities Grid Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                🏨 Available Amenities
              </h3>
              
              {filteredAmenities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <p className="text-gray-500 text-lg mb-2">No amenities found</p>
                  <p className="text-gray-400">Try searching with different keywords</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAmenities.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity.name);
                    return (
                      <button
                        key={amenity.id}
                        onClick={() => handleToggleAmenity(amenity.name)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 border-purple-600 text-white shadow-lg"
                            : "bg-white border-gray-300 text-gray-700 hover:border-purple-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-2xl">{amenity.icon}</span>
                          <span className="text-sm font-medium text-center leading-tight">
                            {amenity.name}
                          </span>
                          {isSelected && (
                            <div className="bg-white bg-opacity-20 rounded-full p-1">
                              <CheckIcon />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Amenities Section */}
            {selectedAmenities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 pb-3 border-b-2 border-green-100">
                  ✅ Selected Amenities ({selectedAmenities.length})
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-wrap gap-3">
                    {selectedAmenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="inline-flex items-center bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm"
                      >
                        <CheckIcon />
                        <span className="ml-2">{amenity}</span>
                        <button
                          onClick={() => removeAmenity(amenity)}
                          className="ml-2 bg-white bg-opacity-20 rounded-full p-1 hover:bg-opacity-30 transition-colors duration-200"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected {selectedAmenities.length} amenities
                  </p>
                  {selectedAmenities.length === 0 && (
                    <p className="text-sm text-red-500">Please select at least one amenity to continue</p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 sm:justify-center">
                              
                  <button
                    onClick={sendAmenitiesToAPI}
                    disabled={isLoading || selectedAmenities.length === 0}
                    className={`w-full sm:w-auto px-12 py-3 font-bold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 ${
                      isLoading || selectedAmenities.length === 0
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {isLoading ? (
                        <>
                          <LoadingSpinner />
                          <span className="ml-2">Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <span className="ml-2">🎉</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl font-bold text-purple-600">{filteredAmenities.length}</div>
              <div className="text-sm text-gray-500">Available Amenities</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600">{selectedAmenities.length}</div>
              <div className="text-sm text-gray-500">Selected Amenities</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((selectedAmenities.length / filteredAmenities.length) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      <Notification />
    </div>
  );
};

