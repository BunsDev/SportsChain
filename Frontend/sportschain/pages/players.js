import { useEffect, useState } from "react";
import { Box, Heading, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";

export default function Players() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/getPlayers')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setPlayers(data.data);
        } else {
          console.error('Error fetching players:', data.error);
        }
      })
      .catch(error => console.error('Error fetching players:', error));
  }, []);

  return (
    <Box bg="black" color="white" minH="100vh" p={4}>
      <Heading as="h1" size="2xl" mb={4}>
        Players
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th color="white">PlayerId</Th>
            <Th color="white">Name</Th>
            <Th color="white">Position</Th>
            <Th color="white">TeamId</Th>
            <Th color="white">Nationality</Th>
          </Tr>
        </Thead>
        <Tbody>
          {players.map(player => (
            <Tr key={player.PlayerId}>
              <Td>{player.PlayerId}</Td>
              <Td>{player.FirstName} {player.LastName}</Td>
              <Td>{player.Position}</Td>
              <Td>{player.TeamId}</Td>
              <Td>{player.Nationality}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}