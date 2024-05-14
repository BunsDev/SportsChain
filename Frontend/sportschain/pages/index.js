import { Box, Button, Flex, Heading, Image, Stack, Text, Link } from "@chakra-ui/react";

export default function Home({ login,signin }) {
  return (
    <Box bg="black" color="white" minH="100vh">
      {/* Header */}
      <Flex as="header" justify="space-between" align="center" p={4} bg="black">
        <Flex align="center">
          <Image src="/sportschain.png" alt="Logo" h="80px" />
          <Flex ml={4}>
            <Link href="#" color="white.400" fontSize="3xl" fontWeight="bold" mx={1}>SportsChain</Link>
          </Flex>
        </Flex>
      </Flex>

      {/* Main Section */}
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
        <Text fontSize="2xl" mb={4}>
        </Text>
        <Text fontSize="lg" mb={8}>
          Discover our new trading platform for sports teams where the value of tokens varies based on the real performance of the teams. Buy, sell, and trade tokens representing your favorite teams with unique rewards.
        </Text>
        <Stack direction="row" spacing={8} justify="center">
          <Button colorScheme="gray" size="lg" onClick={signin}>
            Sign up
          </Button>
          <Button colorScheme="teal" size="lg" onClick={login}>
            Login
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}