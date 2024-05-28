import { Box, Button, Heading, Text, Image, VStack, HStack, Flex } from "@chakra-ui/react";
import { useAuth } from "../context/authContext";
import { useEffect, useState } from "react";

export default function Account() {
  const { user, disconnect } = useAuth();
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      try {
        if (user) {
          const res = await fetch(`/api/tokenBalance?userId=${user.id}`);
          if (!res.ok) {
            throw new Error("Failed to fetch token balance");
          }
          const data = await res.json();
          setTokenBalance(data.balance);
        }
      } catch (error) {
        console.error("Error fetching token balance:", error);
      }
    };

    fetchTokenBalance();
  }, [user]);

  return (
    <Box bg="gray.900" color="white" minH="100vh" p={4}>
      <Flex alignItems="center" justifyContent="space-between" mb={4}>
        <Heading as="h1" size="2xl">
          Welcome to Your Account
        </Heading>
        <Button colorScheme="red" size="lg" onClick={disconnect}>
          Logout
        </Button>
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
            <Text fontSize="xl" mb={2}>Token Balance</Text>
            <Text fontSize="2xl" fontWeight="bold">{tokenBalance} TTK</Text>
          </Box>
        </VStack>
      ) : (
        <Text fontSize="xl">Loading...</Text>
      )}
    </Box>
  );
}