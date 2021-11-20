const axios = require('axios');

const HttpError = require('../models/http-error');

const API_KEY = 'AIzaSyDslkmayxojzMF76pazp_1V7uYWEOSZHfc';

async function getCoordsForAddress(address) {
 return {
   lat: 45.188529,
    lng: 5.724524
  };
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;

  if (!data || data.status === 'ZERO_RESULTS') {
    const error = new HttpError(
      'Could not find location for the specified address.',
      422
    );
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
  
}

module.exports = getCoordsForAddress;
