import { UserProfile } from "@/types";
import { createContext, ReactNode, useContext, useState } from "react";

const placeholderUser: UserProfile = {
  id: "",
  username: "alex",
  displayName: "alex",
  bio: "",
  avatarUrl: "https://i.pravatar.cc/150?u=alex",
  postCount: 0,
  followerCount: 0,
  followingCount: 0,
};

type LoggedInUserContextValue = {
  loggedInUser: UserProfile | null;
  setLoggedInUser: (user: UserProfile) => void;
};

const LoggedInUserContext = createContext<LoggedInUserContextValue | undefined>(
  undefined,
);

export const LoggedInUserProvider = (props: { children: ReactNode }) => {
  const { children } = props;
  //TODO: Update placeholder user
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(
    placeholderUser,
  );

  return (
    <LoggedInUserContext.Provider
      value={{
        loggedInUser,
        setLoggedInUser,
      }}
    >
      {children}
    </LoggedInUserContext.Provider>
  );
};

export const useLoggedInUser = () => {
  const loggedInUserContext = useContext(LoggedInUserContext);
  if (loggedInUserContext == undefined) {
    throw new Error("useLoggedInUser was called outside LoggedInUserProvider");
  } else {
    return loggedInUserContext;
  }
};
