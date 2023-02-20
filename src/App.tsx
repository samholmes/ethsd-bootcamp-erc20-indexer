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
import { ethers } from "ethers";
import { useState } from "react";
import { Loader } from "./components/Loader";
import { useWeb3Account } from "./hooks/useWeb3Account";
import { truncate } from "./utils/truncate";

const { VITE_ALCHEMY_API_KEY } = import.meta.env;

function App() {
  //
  // State:
  //

  const [account, connect] = useWeb3Account();
  const [userAddress, setUserAddress] = useState("vitalik.eth");
  const [error, setError] = useState<any>();
  const [tokenBalances, setTokenBalances] = useState<
    TokenBalancesResponseErc20["tokenBalances"]
  >([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState<
    TokenMetadataResponse[]
  >([]);

  //
  // Derived:
  //

  const isConnected = account !== "";

  async function getTokenBalance() {
    try {
      setIsQuerying(true);
      setError(undefined);

      const config = {
        apiKey: VITE_ALCHEMY_API_KEY,
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(config);

      let address: string = userAddress;
      try {
        const result = await alchemy.core.resolveName(userAddress);
        if (result != null) {
          address = result;
        }
      } catch (error) {}

      if (!ethers.utils.isAddress(address)) {
        throw new Error("Invalid address");
      }

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
      setIsQuerying(false);
      setHasQueried(true);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <Box w="100vw">
      <nav>
        <Flex alignItems="center" justifyContent="space-between">
          <h1 className="logo">Tokédex</h1>
          {isConnected ? (
            <Box>{account}</Box>
          ) : (
            <Button onClick={connect}>Connect</Button>
          )}
        </Flex>
      </nav>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={"center"}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Text>
          Plug in an address and this website will return all of its ERC-20
          token balances!
        </Text>
        <Input
          placeholder="Enter ethereum address"
          value={userAddress}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setUserAddress(event.target.value)
          }
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          fontSize={24}
        />
        {error != null ? <Center color="red">{error.message}</Center> : null}
        <Button fontSize={20} onClick={getTokenBalance} mt={36}>
          Check ERC-20 Token Balances
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {isQuerying ? <Loader /> : null}

        {hasQueried ? (
          <SimpleGrid w={"90vw"} columns={4} spacing={24}>
            {tokenBalances.map((tokenBalance, i) => {
              const logo = tokenDataObjects[i].logo;
              const balance =
                tokenBalance.tokenBalance != null
                  ? ethers.utils.commify(
                      truncate(
                        Utils.formatUnits(
                          tokenBalance.tokenBalance,
                          BigNumber.from(tokenDataObjects[i].decimals)
                        ),
                        2
                      )
                    )
                  : null;
              return (
                <Flex
                  flexDir={"column"}
                  color="white"
                  bg="#111"
                  w={"20vw"}
                  key={tokenBalance.contractAddress}
                  borderRadius={6}
                  padding={12}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box className="ellipsisIt">
                    <b>Balance:</b>&nbsp;
                    <span>{balance}</span>
                  </Box>
                  {logo == null ? null : <Image src={logo} />}
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : null}
      </Flex>
    </Box>
  );
}

export default App;
