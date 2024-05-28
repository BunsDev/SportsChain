import { useEffect, useState } from "react";
import { Box, Heading, Grid, Image, Text, Button, useToast, VStack, HStack, Flex } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useAuth } from "../context/authContext";

// Fonction pour obtenir le nom du fichier logo
const getLogoFileName = (teamName) => {
  return `/logos/${teamName.replace(/ /g, '%20')}.png`;
};

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetch('http://localhost:5000/api/teams')
      .then(response => response.json())
      .then(data => setTeams(data.data || []))
      .catch(error => {
        console.error('Error fetching teams:', error);
        setTeams([]);
      });
  }, []);

  const handleBuy = async (team) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to buy tokens.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tokenContract = new ethers.Contract(team.tokenAddress, [
        "function mint(address to, uint256 amount) public",
      ], signer);

      const tx = await tokenContract.mint(user.address, ethers.utils.parseUnits("10", 18));
      await tx.wait();

      toast({
        title: "Success",
        description: "Successfully bought tokens.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error buying tokens:", error);
      toast({
        title: "Error",
        description: "Failed to buy tokens.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSell = async (team) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to sell tokens.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tokenContract = new ethers.Contract(team.tokenAddress, [
        "function burn(address from, uint256 amount) public",
      ], signer);

      const tx = await tokenContract.burn(user.address, ethers.utils.parseUnits("10", 18));
      await tx.wait();

      toast({
        title: "Success",
        description: "Successfully sold tokens.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error selling tokens:", error);
      toast({
        title: "Error",
        description: "Failed to sell tokens.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box bg="black" color="white" minH="100vh" p={4}>
      <Heading as="h1" size="2xl" mb={4} textAlign="center" fontWeight="bold" color="teal.400">
        Teams
      </Heading>
      <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
        {teams.map(team => {
          const logoSrc = getLogoFileName(team.name);

          return (
            <Flex key={team.teamId} bg="gray.800" p={4} borderRadius="md" textAlign="center" flexDirection="column" justifyContent="space-between">
              <Box>
                <Image src={logoSrc} alt={`${team.name} logo`} boxSize="100px" mx="auto" mb={4} />
                <Text fontSize="xl" fontWeight="bold">{team.name}</Text>
              </Box>
              <HStack mt={4} justify="center">
                <Button colorScheme="green" size="sm" onClick={() => handleBuy(team)}>Buy</Button>
                <Button colorScheme="red" size="sm" onClick={() => handleSell(team)}>Sell</Button>
              </HStack>
            </Flex>
          );
        })}
      </Grid>
    </Box>
  );
}