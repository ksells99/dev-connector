import axios from "axios";
import { setAlert } from "./alert";

import {
  GET_PROFILE,
  GET_PROFILES,
  PROFILE_ERROR,
  UPDATE_PROFILE,
  ACCOUNT_DELETED,
  CLEAR_PROFILE,
  GET_REPOS,
} from "./types";

// Get current user's profile
export const getCurrentProfile = () => async (dispatch) => {
  try {
    // Get profile data - no need to pass in ID as route will know this from token
    const res = await axios.get("/api/profile/me");

    dispatch({
      type: GET_PROFILE,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.message.statusText, status: err.message.status },
    });
  }
};

// Get all profiles
export const getProfiles = () => async (dispatch) => {
  // Ensure current profile state is empty
  dispatch({ type: CLEAR_PROFILE });

  try {
    // Get all profile data
    const res = await axios.get("/api/profile");

    dispatch({
      type: GET_PROFILES,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.message.statusText, status: err.message.status },
    });
  }
};

// Get specific profile by ID
export const getProfileById = (userId) => async (dispatch) => {
  try {
    // Get profile data
    const res = await axios.get(`/api/profile/user/${userId}`);

    dispatch({
      type: GET_PROFILE,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.message.statusText, status: err.message.status },
    });
  }
};

// Get Github repos
export const getGithubRepos = (username) => async (dispatch) => {
  try {
    // Get all profile data
    const res = await axios.get(`/api/profile/github/${username}`);

    dispatch({
      type: GET_REPOS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.message.statusText, status: err.message.status },
    });
  }
};

// Create or update profile
export const createProfile = (formData, history, edit = false) => async (
  dispatch
) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Post formData

    const res = await axios.post("/api/profile", formData, config);

    // Then get the profile
    dispatch({
      type: GET_PROFILE,
      payload: res.data,
    });

    // Show success message
    dispatch(
      setAlert(
        edit ? "Profile updated successfully" : "Profile created successfully",
        "success"
      )
    );

    // Redirect to dashboard after saving
    history.push("/dashboard");

    //
  } catch (err) {
    // Get array of errors (form validation etc.)
    const errors = err.message.data.errors;

    // If there any errors...
    if (errors) {
      // Loop through and call SetAlert function, passing in error message and type
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Add experience
export const addExperience = (formData, history) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.put("/api/profile/experience", formData, config);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data,
    });

    // Show success message
    dispatch(setAlert("Experience added successfully", "success"));

    // Redirect to dashboard after saving
    history.push("/dashboard");

    //
  } catch (err) {
    // Get array of errors (form validation etc.)
    const errors = err.response.data.errors;

    // If there any errors...
    if (errors) {
      // Loop through and call SetAlert function, passing in error message and type
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.message.statusText, status: err.message.status },
    });
  }
};

// Add education
export const addEducation = (formData, history) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.put("/api/profile/education", formData, config);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data,
    });

    // Show success message
    dispatch(setAlert("Education added successfully", "success"));

    // Redirect to dashboard after saving
    history.push("/dashboard");

    //
  } catch (err) {
    // Get array of errors (form validation etc.)
    const errors = err.message.data.errors;

    // If there any errors...
    if (errors) {
      // Loop through and call SetAlert function, passing in error message and type
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Delete experience
export const deleteExperience = (id) => async (dispatch) => {
  try {
    const res = await axios.delete(`/api/profile/experience/${id}`);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data,
    });

    // Show success message
    dispatch(setAlert("Experience removed", "success"));

    //
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Delete education
export const deleteEducation = (id) => async (dispatch) => {
  try {
    const res = await axios.delete(`/api/profile/education/${id}`);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data,
    });

    // Show success message
    dispatch(setAlert("Education removed", "success"));

    //
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Delete account and profile
export const deleteAccount = () => async (dispatch) => {
  if (
    window.confirm("Are you sure? Deleting your account cannot be undone!)")
  ) {
    try {
      // Delete user from server
      await axios.delete(`/api/profile`);

      // Dispatch actions to clear JWT/authentication etc
      dispatch({
        type: CLEAR_PROFILE,
      });

      dispatch({
        type: ACCOUNT_DELETED,
      });

      // Show success message
      dispatch(setAlert("Your account has now been deleted"));

      //
    } catch (err) {
      dispatch({
        type: PROFILE_ERROR,
        payload: { msg: err.response.statusText, status: err.response.status },
      });
    }
  }
};
