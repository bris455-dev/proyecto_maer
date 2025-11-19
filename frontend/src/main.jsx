import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { MenuProvider } from "./context/MenuProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      
      <MenuProvider>
        <App />
      </MenuProvider>
    </AuthProvider>
  </React.StrictMode>
);
