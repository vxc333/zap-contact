import { Routes, Route } from "react-router-dom";
import Extractor from "./pages/Extractor";
import User from "./pages/User";


export default function RoutesComponent() {
  return (
    <Routes>
      <Route path="extractor" element={<Extractor />} />
      <Route path="/" element={<User />} />
    </Routes>
  );
}
