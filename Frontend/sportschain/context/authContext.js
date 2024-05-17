import React, { createContext, useState, useContext, useEffect } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { ethers } from "ethers";

const AuthContext = createContext();

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

const chainConfig = {
  chainId: "0x13882", // Please use 0x1 for Mainnet
  rpcTarget: "https://rpc-amoy.polygon.technology",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  displayName: "Polygon Amoy",
  blockExplorerUrl: "https://amoy.polygonscan.com/",
  ticker: "MATIC",
  tickerName: "Polygon",
  logo: "https://images.toruswallet.io/eth.svg",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: chainConfig },
});

const web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider: privateKeyProvider,
  });

export const AuthProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);


  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing Web3Auth...");
        await web3auth.initModal();
        console.log("Web3Auth initialized");
        if (web3auth.provider) {
          setProvider(new ethers.providers.Web3Provider(web3auth.provider));
          console.log("Provider set during initialization");
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (loggedIn) {
      getUserInfo().then((user) => {
        setUser(user);
        console.log("User info set:", user);
      });
    } else {
      setUser(null);
      console.log("User logged out, user info cleared");
    }
  }, [loggedIn]);

  const connect = async () => {
    try {
      console.log("Connecting...");
      await web3auth.connect();
      console.log("Web3Auth connected");
      if (web3auth.provider) {
        setLoggedIn(true);
        console.log("Provider set after connection and user logged in");
      } else {
        console.log("web3auth.provider is not available after connection");
      }
    } catch (error) {
      console.error("Error during connection:", error);
    }
  };

  const disconnect = async () => {
    try {
      console.log("Disconnecting...");
      if (web3auth.provider) {
        await web3auth.logout();
        setProvider(null);
        setLoggedIn(false);
        console.log("Logged out successfully");
      } else {
        console.log("web3auth.provider is not available for logout");
      }
    } catch (error) {
      console.error("Error during disconnection:", error);
    }
  };

  const getUserInfo = async () => {
    try {
      if (!web3auth.connected) {
        console.log("Cannot get user info, wallet not connected");
        return null;
      }
      console.log("Getting user info...");
      const user = await web3auth.getUserInfo();
      console.log("User info:", user);
      return user;
    } catch (error) {
      console.error("Error getting user info:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ provider, loggedIn, user, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);