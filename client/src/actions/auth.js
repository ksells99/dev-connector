import axios from "axios";
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_PROFILE,
} from "./types";
import { setAlert } from "./alert";
import setAuthToken from "../utils/setAuthToken";

// Load user
export const loadUser = () => async (dispatch) => {
  // Check localstorage for token - if there is, pass into setAuthToken function (setAuthToken.js file)
  if (localStorage.token) {
    setAuthToken(localStorage.token);
  }

  try {
    const res = await axios.get("/api/auth");

    dispatch({
      type: USER_LOADED,
      // send payload (containing user data)
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR,
    });
  }
};

// Register user
export const register = ({ name, email, password }) => async (dispatch) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Prepare user's input to send
  const body = JSON.stringify({ name, email, password });

  try {
    // Post data - pass in body and config
    const res = await axios.post("/api/users", body, config);

    // Send data to payload
    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data,
    });

    // Call loaduser function after registering
    dispatch(loadUser());
  } catch (err) {
    // Get array of errors
    const errors = err.response.data.errors;

    // If there are errors...
    if (errors) {
      // Loop through and call SetAlert function, passing in error message and type
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: REGISTER_FAIL,
    });
  }
};

// Login user
export const login = (email, password) => async (dispatch) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Prepare user's input to send
  const body = JSON.stringify({ email, password });

  try {
    // Post data - pass in body and config
    const res = await axios.post("/api/auth", body, config);

    // Send data to payload
    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data,
    });

    // Call loaduser function after logging in
    dispatch(loadUser());
  } catch (err) {
    // Get array of errors
    const errors = err.response.data.errors;

    // If there are errors...
    if (errors) {
      // Loop through and call SetAlert function, passing in error message and type
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: LOGIN_FAIL,
    });
  }
};

// Logout & clear profile
export const logout = () => (dispatch) => {
  dispatch({ type: CLEAR_PROFILE });
  dispatch({ type: LOGOUT });
};
