import { createContext, useContext } from "react";
import { io, Socket } from "socket.io-client";

const socket = io(); // auto‑connect to same origin / proxied

export const SocketCtx = createContext<Socket>(socket);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SocketCtx.Provider value={socket}>{children}</SocketCtx.Provider>
);

export const useSocket = () => useContext(SocketCtx);