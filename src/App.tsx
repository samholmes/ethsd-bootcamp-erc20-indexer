import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import {
  Alchemy,
  BigNumber,
  Network,
  TokenBalancesResponseErc20,
  TokenMetadataResponse,
  Utils,
} from "alchemy-sdk";
import { useState } from "react";

const { VITE_ALCHEMY_API_KEY } = import.meta.env;

function App() {
  const [userAddress, setUserAddress] = useState("");
  const [tokenBalances, setTokenBalances] = useState<
    TokenBalancesResponseErc20["tokenBalances"]
  >([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState<
    TokenMetadataResponse[]
  >([]);

  async function getTokenBalance() {
    const config = {
      apiKey: VITE_ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(userAddress);

    setTokenBalances(data.tokenBalances);

    const tokenDataPromises: Array<Promise<TokenMetadataResponse>> = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
  }
  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={"center"}
          justifyContent="center"
          flexDirection={"column"}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={"center"}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setUserAddress(event.target.value)
          }
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
          Check ERC-20 Token Balances
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried ? (
          <SimpleGrid w={"90vw"} columns={4} spacing={24}>
            {tokenBalances.map((tokenBalance, i) => {
              const logo = tokenDataObjects[i].logo;
              return (
                <Flex
                  flexDir={"column"}
                  color="white"
                  bg="blue"
                  w={"20vw"}
                  key={tokenBalance.contractAddress}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box>
                    <b>Balance:</b>&nbsp;
                    {tokenBalance.tokenBalance != null
                      ? Utils.formatUnits(
                          tokenBalance.tokenBalance,
                          BigNumber.from(tokenDataObjects[i].decimals)
                        )
                      : null}
                  </Box>
                  {logo == null ? null : <Image src={logo} />}
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          "Please make a query! This may take a few seconds..."
        )}
      </Flex>
    </Box>
  );
}

export default App;
