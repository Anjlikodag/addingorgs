## Adding CitizenBank to the test network

You can use the `addCitizenBank.sh` script to add another organization to the Fabric test network. The `addCitizenBank.sh` script generates the CitizenBank crypto material, creates an CitizenBank organization definition, and adds CitizenBank to a channel on the test network.

You first need to run `./network.sh up createChannel` in the `test-network` directory before you can run the `addCitizenBank.sh` script.

```
./network.sh up createChannel
cd addCitizenBank
./addCitizenBank.sh up
```

If you used `network.sh` to create a channel other than the default `mychannel`, you need pass that name to the `addcitizenBank.sh` script.
```
./network.sh up createChannel -c channel1
cd addCitizenBank
./addCitizenBank.sh up -c channel1
```

You can also re-run the `addCitizenBank.sh` script to add CitizenBank to additional channels.
```
cd ..
./network.sh createChannel -c channel2
cd addCitizenBank
./addCitizenBank.sh up -c channel2
```

For more information, use `./addCitizenBank.sh -h` to see the `addCitizenBank.sh` help text.
