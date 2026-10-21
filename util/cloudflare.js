// Public Cloudflare R2 settings shared by project tooling.
// Never put R2 access keys or secrets in this file; keep them in server/.env.
export const R2_BUCKET_NAME = "hotelroomsstay";
export const R2_ENDPOINT = "https://a5e38fe7f652f044d5b203530fe16a06.r2.cloudflarestorage.com";
export const R2_VIEW_URL = "https://images.hotelroomsstay.com";

export const getR2ViewUrl = (key) =>
  `${R2_VIEW_URL}/${String(key).split("/").map(encodeURIComponent).join("/")}`;
 