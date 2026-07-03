import { configureStore } from "@reduxjs/toolkit";
import { chatApi } from "./api/chatApi";
import chatReducer from "./features/chatSlice";
import projectReducer from "./features/projectSlice";
import userReducer from "./features/userSlice";
import creditReducer from "./features/creditSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      project: projectReducer,
      user: userReducer,
      chat: chatReducer,
      credit: creditReducer,
      [chatApi.reducerPath]: chatApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(chatApi.middleware),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
