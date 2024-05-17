// pages/_app.js
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