import { Buffer } from "node:buffer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

export async function uploadMealImage({ imageData, fileName }) {
  const formData = new FormData();
  formData.append("file", imageData);
  formData.append("fileName", fileName || `meal-${Date.now()}.jpg`);
  formData.append("folder", env.IMAGEKIT_MEAL_FOLDER);
  formData.append("useUniqueFileName", "true");

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64")}`,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.url) {
    throw new AppError("Unable to upload meal image", 502, {
      provider: "imagekit",
      status: response.status,
      message: payload?.message,
    });
  }

  return {
    url: payload.url,
    fileId: payload.fileId,
  };
}
