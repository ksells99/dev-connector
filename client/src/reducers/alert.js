import { SET_ALERT, REMOVE_ALERT } from "../actions/types";
const initialState = [];

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case SET_ALERT:
      // Return current state, then add on new alert from payload
      return [...state, payload];
    case REMOVE_ALERT:
      // Only return the alerts that don't match the ID passed down
      return state.filter((alert) => alert.id !== payload);
    default:
      return state;
  }
}
