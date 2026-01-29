import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { IoClose, IoTrash } from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import baseURL from "../../utils/baseURL";
import { formatDateWithOrdinal } from "../../utils/_dateFunctions";
import { useToast } from "../../utils/toast";
import { Unauthorized, userId } from "../../utils/Unauthorized";

const ReviewCard = ({ reviewData, handleDelete }) => (
  <div className="relative bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5">
    <div className="flex items-center gap-4 mb-3">
      <img
        src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
        alt="User"
        className="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <h4 className="font-semibold text-gray-800">{reviewData?.userName}</h4>
        <p className="text-xs text-gray-500">
          {formatDateWithOrdinal(reviewData?.createdAt)}
        </p>
      </div>
    </div>
    <p className="italic text-gray-600 mb-3">"{reviewData.comment}"</p>
    <div className="flex items-center gap-1 mb-2">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          className={`text-sm ${
            i < reviewData.rating ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
    <button
      onClick={() => handleDelete(reviewData._id)}
      className="absolute top-3 right-3 p-2 rounded-full hover:bg-red-50 text-red-500 transition"
      aria-label="delete"
    >
      <IoTrash className="text-lg" />
    </button>
  </div>
);

const SkeletonCard = () => (
  <div className="animate-pulse bg-white p-5 rounded-xl shadow-sm space-y-3">
    <div className="flex gap-3 items-center">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

export default function Reviews() {
  const toast = useToast();
  const location = useLocation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem("rsUserId");
        if (!userId) {
          setLoading(false);
          return;
        }
        const response = await fetch(
          `${baseURL}/reviewDatas/userId?userId=${userId}`
        );
        if (!response.ok) throw new Error("Error fetching reviews");
  const result = await response.json();
  // Normalize response: API may return { data: [...] } or [...]
  let reviews = [];
  if (Array.isArray(result)) reviews = result;
  else if (Array.isArray(result.data)) reviews = result.data;
  else if (Array.isArray(result.result)) reviews = result.result;
  else if (Array.isArray(result.reviewDatas)) reviews = result.reviewDatas;
  else if (Array.isArray(result.reviews)) reviews = result.reviews;
  else reviews = [];
  setData(reviews);
      } catch (error) {
        toast.error("Error fetching reviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    try {
      const response = await axios.delete(`${baseURL}/delete/${reviewId}`);
      if (response.status === 200) {
        toast.success("Review deleted successfully!");
        setData((prev) => prev.filter((item) => item._id !== reviewId));
      }
    } catch {
      toast.error("Error deleting review.");
    }
  };

  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const safeData = Array.isArray(data) ? data : [];
  const currentReviews = safeData.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(safeData.length / reviewsPerPage);

  if (location.pathname !== "/reviews") return null;
  if (!userId) return <Unauthorized />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
          {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : currentReviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {currentReviews.map((review) => (
            <ReviewCard
              key={review._id}
              reviewData={review}
              handleDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          <p className="text-lg">You haven't left any reviews yet.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  currentPage === i + 1
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
