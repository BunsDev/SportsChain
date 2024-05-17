# Documentation: Next.js Application

## Overview

This document provides an overview and explanation of the Next.js application using Chakra UI for styling and a custom authentication context for managing user authentication state.

## File Structure

1. **`pages/_app.js`**: Custom App component that wraps every page with the necessary providers.
2. **`context/authContext.js`**: Authentication context providing authentication state and functions.
3. **`pages/index.js`**: Home component which uses the authentication context and Chakra UI components.

### `pages/_app.js`

The `_app.js` file customizes the default App component in Next.js. It wraps every page with `ChakraProvider` and `AuthProvider`.

```javascript
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "../context/authContext";

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ChakraProvider>
  );
}

export default MyApp;
```

### `context/authContext.js`

The `authContext.js` file defines the authentication context using React's Context API and Web3Auth for Ethereum authentication.

```javascript
import React, { createContext, useState, useContext, useEffect } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { ethers } from "ethers";

const AuthContext = createContext();

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

const chainConfig = {
  chainId: "0x13882",
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
```

### `pages/index.js`

The `index.js` file defines the Home component, which is the main landing page of the application. It uses Chakra UI for styling and the custom authentication context for user authentication.

```javascript
import { Box, Button, Flex, Heading, Image, Stack, Text, Link } from "@chakra-ui/react";
import { useAuth } from "../context/authContext.js";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const { connect, disconnect, loggedIn } = useAuth();
  const router = useRouter();

  console.log('LoggedIn state:', loggedIn);

  useEffect(() => {
    if (loggedIn) {
      router.push('/account');
    }
  }, [loggedIn]);

  return (
    <Box bg="black" color="white" minH="100vh">
      <Flex as="header" justify="space-between" align="center" p={4} bg="black">
        <Flex align="center">
          <Image src="/sportschain.png" alt="Logo" h="80px" />
          <Flex ml={4}>
            <Link href="#" color="white" fontSize="3xl" fontWeight="bold" mx={1}>SportsChain</Link>
          </Flex>
        </Flex>
      </Flex>

      <Box
        bgImage="url('/background.jpg')"
        bgPosition="center"
        bgRepeat="no-repeat"
        bgSize="cover"
        textAlign="center"
        py={20}
        px={4}
      >
        <Heading as="h1" size="4xl" mb={4}>
          FootBall Trading Platform
        </Heading>
        <Text fontSize="lg" mb={8}>
          Discover our new trading platform for sports teams where the value of tokens varies based on the real performance of the teams. Buy, sell, and trade tokens representing your favorite teams with unique rewards.
        </Text>
        <Stack direction="row" spacing={8} justify="center">
          {loggedIn ? (
            <Button colorScheme="red" size="lg" onClick={disconnect}>
              Logout
            </Button>
          ) : (
            <>
              <Button colorScheme="gray" size="lg" onClick={connect}>
                Sign up
              </Button>
              <Button colorScheme="teal" size="lg" onClick={connect}>
                Login
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
```

## Conclusion

This document provides a comprehensive overview of the Next.js application setup with Chakra UI and custom authentication using Web3Auth. The provided files include the main application wrapper, the authentication context, and the Home component.