const SECRET_KEY = "c0n3ct4d0";

export const encryptEmail = (email) => {
  if (!email) return "";
  try {
    let encrypted = "";
    for (let i = 0; i < email.length; i++) {
      encrypted += String.fromCharCode(email.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return btoa(encodeURIComponent(encrypted));
  } catch (e) {
    return btoa(email); // fallback
  }
};

export const decryptEmail = (encoded) => {
  if (!encoded) return "";
  try {
    const decoded = decodeURIComponent(atob(encoded));
    let email = "";
    for (let i = 0; i < decoded.length; i++) {
      email += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return email;
  } catch (e) {
    // Fallback if it was just base64 encoded previously
    try {
      return atob(encoded);
    } catch (err) {
      return "";
    }
  }
};