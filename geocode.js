const axios = require("axios");

const getCoordinates = async (location) => {
  const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY; // Load from .env
  const encodedLocation = encodeURIComponent(location);
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedLocation}&key=${OPENCAGE_API_KEY}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { lat, lng };
    } else {
      throw new Error("No coordinates found for this location.");
    }
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return null;
  }
};

module.exports = getCoordinates;
