import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

/**
 * Sanitizes user input to prevent XSS attacks.
 * @param {string} input - The input string to sanitize.
 * @returns {string} The sanitized string.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates if a string is a valid UUID.
 * @param {string} uuid - The UUID string to validate.
 * @returns {boolean} True if the UUID is valid, false otherwise.
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates if a string is a valid hub ID (either UUID or numeric).
 * @param {string} hubId - The hub ID string to validate.
 * @returns {boolean} True if the hub ID is valid, false otherwise.
 */
export function isValidHubId(hubId: string): boolean {
  if (!hubId) return false;
  // Check if it's a valid UUID
  if (isValidUUID(hubId)) return true;
  // Check if it's a valid numeric ID
  return /^\d+$/.test(hubId);
}

/**
 * Generates a random password of specified length.
 * @param {number} length - The length of the password to generate.
 * @returns {string} The generated password.
 */
export function generateRandomPassword(length: number = 6): string {
  const digits = "0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    password += digits[randomIndex];
  }
  return password;
}

/**
 * Validates if a string is a valid coordinate (latitude or longitude).
 * @param {string} coord - The coordinate string to validate.
 * @returns {boolean} True if the coordinate is valid, false otherwise.
 */
export function isValidCoordinate(coord: string): boolean {
  const coordRegex = /^-?\d+(\.\d+)?$/;
  return coordRegex.test(coord);
}

/**
 * Calculates the distance between two coordinates in kilometers.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} The distance in kilometers.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
