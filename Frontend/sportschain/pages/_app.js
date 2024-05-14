import { ChakraProvider } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Web3Auth } from '@web3auth/web3auth';
import { Web3Provider } from '@ethersproject/providers';
import process from 'process';

const clientId = process.env.WEB3AUTHID

function MyApp({ Component, pageProps }) {
  const [web3auth, setWeb3auth] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth({
          clientId,
          chainConfig: {
            chainNamespace: "eip155",
            chainId: "0x1",  // Mainnet Ethereum
          },
        });
        await web3auth.initModal();
        setWeb3auth(web3auth);
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      console.log("Web3Auth not initialized yet");
      return;
    }
    const provider = await web3auth.connect();
    setProvider(new Web3Provider(provider));
  };

  const signin = async () => {
    if (!web3auth) {
      console.log("Web3Auth not initialized yet");
      return;
    }
    try {
      const user = await web3auth.connect();
      // Vous ajouter ici logique pour enregistrer l'utilisateur abonné
      console.log('User subscribed:', user);
      alert('You have successfully subscribed!');
    } catch (error) {
      console.error("Subscription error:", error);
      alert('An error occurred during subscription.');
    }
  }
  const logout = async () => {
    if (!web3auth) {
      console.log("Web3Auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
  };

  return (
    <ChakraProvider>
      <Component {...pageProps} web3auth={web3auth} provider={provider}  login={login} signin={signin} logout={logout} />
    </ChakraProvider>
  );
}

export default MyApp;