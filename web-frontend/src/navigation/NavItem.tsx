import { NavLink } from "react-router-dom";

interface NavItemProps {
  to: string;
  text: string;
}

export const NavItem = (props: NavItemProps) => {
  return (
    <>
      <NavLink
        to={props.to}
        style={({ isActive }) => ({ color: isActive ? "blue" : "black" })}
      >
        {props.text}
      </NavLink>
    </>
  );
};
