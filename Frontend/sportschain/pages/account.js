import { Box, Button, Heading, Text, Image, VStack, HStack, Flex } from "@chakra-ui/react";
import { useAuth } from "../context/authContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import teamsData from './teams.json'; // Assurez-vous que le chemin vers votre fichier JSON est correct

export default function Account() {
  const { user, provider, disconnect } = useAuth();
  const [nativeBalance, setNativeBalance] = useState(0);
  const [teamBalances, setTeamBalances] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        if (user && provider) {
          const signer = provider.getSigner();
          const userAddress = await signer.getAddress();

          // Fetch native balance (MATIC)
          const balance = await provider.getBalance(userAddress);
          setNativeBalance(ethers.utils.formatEther(balance));

          // Fetch team token balances
          const teamBalances = await Promise.all(teamsData.map(async team => {
            const tokenContract = new ethers.Contract(team.tokenAddress, [
              "function balanceOf(address owner) view returns (uint256)"
            ], signer);

            const balance = await tokenContract.balanceOf(userAddress);
            return {
              name: team.name,
              balance: ethers.utils.formatUnits(balance, 18),
              symbol: team.symbol
            };
          }));

          setTeamBalances(teamBalances);
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
  }, [user, provider]);

  const handleTradeTokens = () => {
    router.push('/teams');
  };

  return (
    <Box bg="gray.900" color="white" minH="100vh" p={4}>
      <Flex alignItems="center" justifyContent="space-between" mb={4}>
        <Heading as="h1" size="2xl">
          Welcome to Your Account
        </Heading>
        <HStack>
          <Button colorScheme="blue" size="lg" onClick={handleTradeTokens}>
            Trade Tokens
          </Button>
          <Button colorScheme="red" size="lg" onClick={disconnect}>
            Logout
          </Button>
        </HStack>
      </Flex>
      
      {user ? (
        <VStack spacing={4} align="start">
          <HStack>
            {user.profileImage && (
              <Image
                borderRadius="full"
                boxSize="150px"
                src={user.profileImage}
                alt="Profile Image"
                mr={4}
              />
            )}
            <VStack align="start">
              <Text fontSize="xl">Name: {user.name}</Text>
              <Text fontSize="xl">Email: {user.email}</Text>
              <Text fontSize="xl">Public Key: {user.publicKey}</Text> {/* Affichage de la clé publique */}
            </VStack>
          </HStack>
          <Box bg="gray.800" p={4} borderRadius="md" w="full">
            <Text fontSize="xl" mb={2}>Native Balance (MATIC)</Text>
            <Text fontSize="2xl" fontWeight="bold">{nativeBalance}</Text>
          </Box>
          {teamBalances.map(team => (
            team.balance > 0 && (
              <Box key={team.name} bg="gray.800" p={4} borderRadius="md" w="full">
                <Text fontSize="xl" mb={2}>{team.name} Token Balance</Text>
                <Text fontSize="2xl" fontWeight="bold">{team.balance} {team.symbol}</Text>
              </Box>
            )
          ))}
        </VStack>
      ) : (
        <Text fontSize="xl">Loading...</Text>
      )}
    </Box>
  );
}