import { useNavigate } from "react-router-dom"; // Import the useNavigate hook

export const Unauthorized = () => {
  const token = localStorage.getItem("rsToken");
  const navigate = useNavigate(); // Initialize the navigate function

  if (!userId) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column", // Align items in a column
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffffff",
          minHeight: "50vh",
        }}
      >
        <img
          src="https://arkca.com/assets/img/login.gif"
          alt="Login required"
          style={{ maxWidth: "200px", maxHeight: "150px" }}
        />
        {/* Mobile-friendly image size */}
        <p
          style={{
            marginTop: "10px",
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          You are not logged in
          <br />
          Please log in
          <br />
          <button
            onClick={() => navigate("/login")}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              border: "none",
              borderRadius: "5px",
              backgroundColor: "#007bff", // Example button color
              color: "white",
            }}
          >
            Log In
          </button>
        </p>
      </div>
    );
  }

  return null; // Return null if the userId exists
};
export const userId = localStorage.getItem("rsUserId");
export const token = localStorage.getItem("rsToken");
export const userMobile = localStorage.getItem("rsUserMobile");
export const userEmail = localStorage.getItem("roomsstayUserEmail");
export const userName = localStorage.getItem("rsUserName");
