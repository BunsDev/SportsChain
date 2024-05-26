import { useEffect, useState } from "react";
import { Box, Heading, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";

export default function Teams() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetch('/api/teams')
      .then(response => response.json())
      .then(data => setTeams(data.data))
      .catch(error => console.error('Error fetching teams:', error));
  }, []);

  return (
    <Box bg="black" color="white" minH="100vh" p={4}>
      <Heading as="h1" size="2xl" mb={4}>
        Teams
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th color="white">TeamId</Th>
            <Th color="white">Name</Th>
            <Th color="white">AreaId</Th>
          </Tr>
        </Thead>
        <Tbody>
          {teams.map(team => (
            <Tr key={team.TeamId}>
              <Td>{team.TeamId}</Td>
              <Td>{team.Name}</Td>
              <Td>{team.AreaId}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
