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
          const ethersProvider = new ethers.providers.Web3Provider(web3auth.provider);
          setProvider(ethersProvider);
          setLoggedIn(true);
          const userInfo = await web3auth.getUserInfo();
          const signer = ethersProvider.getSigner();
          const publicKey = await signer.getAddress();
          setUser({ ...userInfo, publicKey });
          console.log("User info set during initialization:", { ...userInfo, publicKey });
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      }
    };

    init();
  }, []);

  const connect = async () => {
    try {
      console.log("Connecting...");
      await web3auth.connect();
      console.log("Web3Auth connected");
      if (web3auth.provider) {
        const ethersProvider = new ethers.providers.Web3Provider(web3auth.provider);
        setProvider(ethersProvider);
        setLoggedIn(true);
        const userInfo = await web3auth.getUserInfo();
        const signer = ethersProvider.getSigner();
        const publicKey = await signer.getAddress();
        setUser({ ...userInfo, publicKey });
        console.log("User info set after connection:", { ...userInfo, publicKey });
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
        setUser(null);
        console.log("Logged out successfully");
      } else {
        console.log("web3auth.provider is not available for logout");
      }
    } catch (error) {
      console.error("Error during disconnection:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ provider, loggedIn, user, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);