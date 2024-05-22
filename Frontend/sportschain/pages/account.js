// src/pages/account.js
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { useAuth } from "../context/authContext";

export default function Account() {
  const { user, disconnect } = useAuth();
  console.log('User:', user);

  const handleTransaction = async () => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        teamId: selectedTeam.id,
        amount: transactionAmount,
      }),
    });
    const data = await res.json();
    console.log(data);
  };

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    setTransactions(data.data);
  };
  
  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <Box bg="black" color="white" minH="100vh" p={4}>
      <Heading as="h1" size="2xl" mb={4}>
        Welcome to Your Account
      </Heading>
      {user ? (
        <>
          <Text fontSize="xl" mb={4}>Name: {user.name}</Text>
          <Text fontSize="xl" mb={4}>Email: {user.email}</Text>
          <image fontSize="xl" mb={4}> image: {user.profileImage}</image>
          <Button colorScheme="red" size="lg" onClick={disconnect}>
            Logout
          </Button>
        </>
      ) : (
        <Text fontSize="xl">Loading...</Text>
      )}
    </Box>
  );
}