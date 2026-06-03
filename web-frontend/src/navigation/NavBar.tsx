import { Outlet } from "react-router-dom";
import { NavItem } from "./NavItem";

export const NavBar = () => {
  return (
    <>
      <Outlet />
      <NavItem to="/" text="Feed" />
      <NavItem to="/profile" text="Profile" />
      <NavItem to="/messages" text="Messages" />
      <NavItem to="/settings" text="Settings" />
      Post
    </>
  );
};
