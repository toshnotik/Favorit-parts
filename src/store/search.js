import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { fetchParts } from "../api/parts";

export const searchManufacturers = createAsyncThunk(
  "search/manufacturers",
  (number, { signal }) => fetchParts({ number }, signal),
);
export const searchOffers = createAsyncThunk(
  "search/offers",
  ({ number, brand }, { signal }) =>
    fetchParts({ number, brand, analogues: "on" }, signal),
);
const initialState = {
  number: "",
  brand: "",
  manufacturers: [],
  goods: [],
  status: "idle",
  stage: "manufacturers",
  error: "",
  requestId: null,
};
const slice = createSlice({
  name: "search",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(searchManufacturers.pending, (state, action) => {
      Object.assign(state, initialState, {
        number: action.meta.arg,
        status: "loading",
        requestId: action.meta.requestId,
      });
    });
    builder.addCase(searchOffers.pending, (state, action) => {
      state.brand = action.meta.arg.brand;
      state.goods = [];
      state.error = "";
      state.status = "loading";
      state.stage = "offers";
      state.requestId = action.meta.requestId;
    });
    for (const thunk of [searchManufacturers, searchOffers]) {
      builder.addCase(thunk.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = "succeeded";
        if (thunk === searchManufacturers)
          state.manufacturers = [
            ...new Set(action.payload.map((item) => item.brand)),
          ];
        else state.goods = action.payload;
      });
      builder.addCase(thunk.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = "failed";
        state.error = action.error.message || "Не удалось выполнить поиск.";
      });
    }
  },
});
export const createAppStore = () =>
  configureStore({ reducer: { search: slice.reducer } });
