// src/config/api.js

const isProduction = import.meta.env.MODE === "production";

const config = {
  development: {
    // BASE_URL: "https://www.savorka.in/api",
    BASE_URL: "http://localhost:5000/api",
  },
  production: {
    // BASE_URL: "https://www.savorka.in/api",
    BASE_URL: "http://localhost:5000/api",
  },
};

const API_BASE_URL = isProduction
  ? config.production.BASE_URL
  : config.development.BASE_URL;

export default API_BASE_URL;