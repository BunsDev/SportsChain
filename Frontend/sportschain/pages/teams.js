import { useEffect, useState } from "react";
import { Box, Heading, Grid, Image, Text, Button, useToast, VStack, HStack, Input, Flex, Spinner } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useAuth } from "../context/authContext";

// Fonction pour obtenir le nom du fichier logo
const getLogoFileName = (teamName) => {
  return `/logos/${teamName.replace(/ /g, '%20')}.png`;
};

export default function TokenTrading() {
  const [teams, setTeams] = useState([]);
  const [amounts, setAmounts] = useState({}); // Etat pour stocker les montants d'achat et de vente par équipe
  const [loading, setLoading] = useState({}); // Etat pour gérer le statut de chargement par équipe
  const { user, provider, connect } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!provider) {
      connect(); // Assurez-vous que l'utilisateur est connecté
    }
  }, [provider, connect]);

  useEffect(() => {
    fetch('http://localhost:5000/api/teams')
      .then(response => response.json())
      .then(data => {
        setTeams(data.data || []);
        // Initialiser les montants et le statut de chargement à "1" pour chaque équipe
        const initialAmounts = {};
        const initialLoading = {};
        data.data.forEach(team => {
          initialAmounts[team.teamId] = { buy: "1", sell: "1" };
          initialLoading[team.teamId] = { buy: false, sell: false };
        });
        setAmounts(initialAmounts);
        setLoading(initialLoading);
      })
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

    if (!provider) {
      toast({
        title: "Error",
        description: "Web3 provider is not available. Please make sure you are connected.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [team.teamId]: { ...prev[team.teamId], buy: true } }));

      const signer = provider.getSigner();
      const tokenManagerAddress = "0xB43115938E37cD1226dBf2fD854b1d59388f1033"; // Adresse du contrat TokenManager
      const tokenManagerABI = [
        "function buyTokens(uint256 teamID) payable",
        "function getTokenPrice(uint256 teamID) public view returns (uint256)"
      ];
      const tokenManager = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

      const teamID = team.teamId;
      const price = await tokenManager.getTokenPrice(teamID);
      const amountToBuy = ethers.utils.parseUnits(amounts[teamID].buy, 1);
      const totalCost = price.mul(amountToBuy);
      const tx = await tokenManager.buyTokens(teamID, { value: totalCost });
      await tx.wait();

      toast({
        title: "Success",
        description: `Successfully bought ${amounts[teamID].buy} tokens.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const errorData = error?.data?.message || error.message;
      console.error("Error buying tokens:", errorData);
      toast({
        title: "Error",
        description: `Failed to buy tokens. ${errorData}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(prev => ({ ...prev, [team.teamId]: { ...prev[team.teamId], buy: false } }));
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

    if (!provider) {
      toast({
        title: "Error",
        description: "Web3 provider is not available. Please make sure you are connected.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!team.tokenAddress) {
      toast({
        title: "Error",
        description: "Token address is missing.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [team.teamId]: { ...prev[team.teamId], sell: true } }));

      const signer = provider.getSigner();
      const tokenManagerAddress = "0xB43115938E37cD1226dBf2fD854b1d59388f1033"; // Adresse du contrat TokenManager
      const tokenManagerABI = [
        "function sellTokens(uint256 teamID, uint256 amountToSell) payable",
        "function getTokenPrice(uint256 teamID) public view returns (uint256)"
      ];
      const tokenManager = new ethers.Contract(tokenManagerAddress, tokenManagerABI, signer);

      const tokenABI = [
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function approve(address spender, uint256 amount) public returns (bool)"
      ];
      const token = new ethers.Contract(team.tokenAddress, tokenABI, signer);

      const teamID = team.teamId;
      const amountToSell = ethers.utils.parseUnits(amounts[teamID].sell, 1); // Montant à vendre
      const allowance = await token.allowance(user.publicKey, tokenManagerAddress);

      if (allowance.lt(amountToSell)) {
        const approveTx = await token.approve(tokenManagerAddress, amountToSell);
        await approveTx.wait();
      }

      const tx = await tokenManager.sellTokens(teamID, amountToSell);
      await tx.wait();

      toast({
        title: "Success",
        description: `Successfully sold ${amounts[teamID].sell} tokens.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const errorData = error?.data?.message || error.message;
      console.error("Error selling tokens:", errorData);
      toast({
        title: "Error",
        description: `Failed to sell tokens. ${errorData}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(prev => ({ ...prev, [team.teamId]: { ...prev[team.teamId], sell: false } }));
    }
  };

  const handleInputChange = (teamID, type, value) => {
    setAmounts(prevAmounts => ({
      ...prevAmounts,
      [teamID]: {
        ...prevAmounts[teamID],
        [type]: value
      }
    }));
  };

  return (
    <Box bg="black" color="white" minH="100vh" p={4}>
      <Heading as="h1" size="2xl" mb={4}>
        Token Trading
      </Heading>
      <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
        {teams.map(team => {
          const logoSrc = getLogoFileName(team.name);

          return (
            <Flex key={team.teamId} bg="gray.800" p={4} borderRadius="md" textAlign="center" flexDirection="column" justifyContent="space-between">
              <Box>
                <Image src={logoSrc} alt={`${team.name} logo`} boxSize="100px" mx="auto" mb={4} />
                <Text fontSize="xl" fontWeight="bold">{team.name}</Text>
              </Box>
              <HStack mt={4} justify="center">
                <VStack>
                  <Input
                    placeholder="Amount to buy"
                    value={amounts[team.teamId]?.buy || "1"}
                    onChange={(e) => handleInputChange(team.teamId, "buy", e.target.value)}
                    width="100px"
                    color="black"
                  />
                  <Button colorScheme="green" size="sm" onClick={() => handleBuy(team)} isLoading={loading[team.teamId]?.buy}>
                    {loading[team.teamId]?.buy ? <Spinner size="sm" /> : "Buy"}
                  </Button>
                </VStack>
                <VStack>
                  <Input
                    placeholder="Amount to sell"
                    value={amounts[team.teamId]?.sell || "1"}
                    onChange={(e) => handleInputChange(team.teamId, "sell", e.target.value)}
                    width="100px"
                    color="black"
                  />
                  <Button colorScheme="red" size="sm" onClick={() => handleSell(team)} isLoading={loading[team.teamId]?.sell}>
                    {loading[team.teamId]?.sell ? <Spinner size="sm" /> : "Sell"}
                  </Button>
                </VStack>
              </HStack>
            </Flex>
          );
        })}
      </Grid>
    </Box>
  );
}