import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import RoomSetup from "./pages/RoomSetup";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;