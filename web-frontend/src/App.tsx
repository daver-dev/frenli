import { Route, Routes } from "react-router-dom";
import "./App.css";
import { Feed } from "./pages/Feed";
import { NavBar } from "./navigation/NavBar";
import { Messages } from "./pages/Messages";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";

const App = () => {
  return (
    <>
      <Routes>
        <Route element={<NavBar />}>
          <Route index element={<Feed />} />
          <Route path="profile" element={<Profile />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
