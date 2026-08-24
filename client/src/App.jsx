import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import RoomSetup from "./pages/RoomSetup";
import LayoutView from "./pages/LayoutView";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>{" | "}
        <Link to="/room-setup">Room Setup</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room-setup" element={<RoomSetup />} />
        <Route path="/layout" element={<LayoutView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;