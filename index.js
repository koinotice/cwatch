var gethIPCPath = "https://rinkeby.infura.io/v3/26b9e69bffe84bafbd0e16cbad56365f";

const Web3 = require("web3")
const {address, hashabi} = require("./hashDice")
var RINKEBY_WSS = 'wss://rinkeby.infura.io/ws';
var provider = new Web3.providers.WebsocketProvider(RINKEBY_WSS);
var web3 = new Web3(provider);

const nats = require('nats').connect("nats://admin:Zheli123@71an.com:4222");

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

// Subscribe to Transfer events matching filter criteria
async function rooms() {
    const events = await myContract.getPastEvents(
        'RoomOpened',
        {
            fromBlock: 0,
            toBlock: "latest"
        }
    )

    await Promise.all(events.map(async event => {

        nats.publish(address, JSON.stringify(event));
        //console.log(event)
    }))
}

async function orders() {
    const events = await myContract.getPastEvents(
        'NewBetOrder',
        {
            fromBlock: 0,
            toBlock: "latest"
        }
    )

    await Promise.all(events.map(async event => {

        nats.publish(address, JSON.stringify(event));
        //console.log(event)
    }))
}

async function allEvents() {
    const events = await myContract.getPastEvents(
        'NewBetOrder',
        {
            fromBlock: 0,
            toBlock: "latest"
        }
    )

    await Promise.all(events.map(async event => {

        nats.publish(address, JSON.stringify(event));

    }))
}

let ClastBlock = 0

async function checkForEvents() {
    const nextBlock = ClastBlock + 1
    const lastBlock = await new Promise(
        (reject, resolve) =>
            web3.eth.getBlockNumber((result, err) => {
                if (err) reject(err)
                resolve(result)
            })
    )
    console.log(nextBlock, lastBlock)
    // check for new bid events
    if (nextBlock <= lastBlock) {
        console.log("0000")
        const events = await myContract.getPastEvents(
            'allEvents',
            {
                fromBlock: nextBlock,
                toBlock: lastBlock
            }
        )

        await Promise.all(events.map(async event => {
            console.log(event)
            nats.publish(address, JSON.stringify(event));
        }))
       // await Contract.update({address: this.contractAddress}, {$set: {lastBlock: lastBlock}}, {})


        ClastBlock = lastBlock
    }
}



async function main() {
    await rooms()
    await orders()

    setInterval(async () => {
        try {

            await checkForEvents()

        } catch (err) {
            console.error(err)

        }
    }, 15 * 1000) // every 15 seconds check for new events
}

main();