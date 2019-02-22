var gethIPCPath = "https://rinkeby.infura.io/v3/26b9e69bffe84bafbd0e16cbad56365f";

const Web3=require("web3")
const {address,hashabi}=require("./hashDice")
var RINKEBY_WSS = 'wss://rinkeby.infura.io/ws';
var provider = new Web3.providers.WebsocketProvider(RINKEBY_WSS);
var web3 = new Web3(provider);

provider.on('error', e => {
    console.error('WS Infura Error', e);
});

provider.on('end', e => {
    console.log('WS closed');
    console.log('Attempting to reconnect...');
    provider = new Web3.providers.WebsocketProvider(RINKEBY_WSS);
    provider.on('connect', function () {
        console.log('WSS Reconnected');
    });
    web3.setProvider(provider);
    listening();
});

setInterval(function () {
    web3.eth.net.isListening().then().catch(e => {
        console.log('[ - ] Lost connection to the node, reconnecting');
        web3.setProvider(RINKEBY_WSS);
        listening();
    })
}, 200);

var myContract = new web3.eth.Contract(hashabi, address);
// Generate filter options
const options = {
    toBlock: 'latest'
}
console.log('Start programs !');
listening();
// Subscribe to Transfer events matching filter criteria
async function listening() {
    const events = await myContract.getPastEvents(
        'RoomOpened',
        {
            fromBlock: 0,
            toBlock: "latest"
        }
    )

    await Promise.all(events.map(async event => {

       // nats.publish(this.contractAddress, JSON.stringify( event));
        console.log(event)
    }))
    


}