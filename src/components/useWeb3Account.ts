import { ethers } from "ethers";
import { useEffect, useState } from "react";

type ToggleConnect = () => void;

const LOCAL_STORAGE_KEY = "eth_accountAddress";

export function useWeb3Account(): [string, ToggleConnect] {
  const [accountAddress, setAccountAddress] = useState("");

  const handleAccounts = (accounts: string) => {
    if (accounts.length > 0) {
      const account = accounts[0];
      setAccountAddress(account);
      localStorage.setItem(LOCAL_STORAGE_KEY, account);
    } else {
      setAccountAddress("");
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Check local storage
  useEffect(() => {
    const handler = async () => {
      const cachedAddress = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cachedAddress != null) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
          const accounts = await provider.send("eth_accounts", []);
          handleAccounts(accounts);
        } catch (error) {
          console.log(error);
        }
      }
    };
    handler().catch(console.error);
  }, []);

  // Event listener for change account
  useEffect(() => {
    window.ethereum.on("accountsChanged", handleAccounts);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccounts);
    };
  }, []);

  const connect = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const [accountAddress] = await provider.send("eth_requestAccounts", []);
      setAccountAddress(accountAddress);
      localStorage.setItem(LOCAL_STORAGE_KEY, accountAddress);
    } catch (error) {
      console.error(error);
    }
  };

  return [accountAddress, connect];
}
