import axios from "axios";

const setAuthToken = (token) => {
  // Check localstorage for token, if there is, pass into header
  if (token) {
    axios.defaults.headers.common["x-auth-token"] = token;
  } else {
    // Else delete it
    delete axios.defaults.headers.common["x-auth-token"];
  }
};

export default setAuthToken;
