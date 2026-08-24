import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import RoomSetup from "./pages/RoomSetup";
import LayoutView from "./pages/LayoutView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/room-setup"
          element={<RoomSetup />}
        />

        <Route
          path="/layout"
          element={<LayoutView />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;