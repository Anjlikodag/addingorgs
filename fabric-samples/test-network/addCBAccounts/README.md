## Adding CBAccounts to the test network

You can use the `addCBAccounts.sh` script to add another organization to the Fabric test network. The `addCBAccounts.sh` script generates the CBAccounts crypto material, creates an CBAccounts organization definition, and adds CBAccounts to a channel on the test network.

You first need to run `./network.sh up createChannel` in the `test-network` directory before you can run the `addCBAccounts.sh` script.

```
./network.sh up createChannel
cd addCBAccounts
./addCBAccounts.sh up
```

If you used `network.sh` to create a channel other than the default `mychannel`, you need pass that name to the `addcbAccounts.sh` script.
```
./network.sh up createChannel -c channel1
cd addCBAccounts
./addCBAccounts.sh up -c channel1
```

You can also re-run the `addCBAccounts.sh` script to add CBAccounts to additional channels.
```
cd ..
./network.sh createChannel -c channel2
cd addCBAccounts
./addCBAccounts.sh up -c channel2
```

For more information, use `./addCBAccounts.sh -h` to see the `addCBAccounts.sh` help text.
