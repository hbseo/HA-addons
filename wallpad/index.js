const net = require('net');
const mqtt = require('mqtt');

const CONFIG = require('/data/options.json');

const CONST = {
    TOPIC_PREFIX: 'home',
    COMMAND_TOPIC: 'home/+/+/command',

    DEVICE_STATE: [
        {name: 'light', id: '1', hex: 'B0000100000000B1', state: 'OFF'},
        {name: 'light', id: '1', hex: 'B0010100000000B2', state: 'ON'},
        {name: 'light', id: '2', hex: 'B0000200000000B2', state: 'OFF'},
        {name: 'light', id: '2', hex: 'B0010200000000B3', state: 'ON'},
        {name: 'light', id: '3', hex: 'B0000300000000B3', state: 'OFF'},
        {name: 'light', id: '3', hex: 'B0010300000000B4', state: 'ON'}
    ],

    DEVICE_COMMAND: [
        {name: 'light', id: '1', hex: '3101000000000032', command: 'OFF'},
        {name: 'light', id: '1', hex: '3101010000000033', command: 'ON'},
        {name: 'light', id: '2', hex: '3102000000000033', command: 'OFF'},
        {name: 'light', id: '2', hex: '3102010000000034', command: 'ON'},
        {name: 'light', id: '3', hex: '3103000000000034', command: 'OFF'},
        {name: 'light', id: '3', hex: '3103010000000035', command: 'ON'}
    ]
}

// Initialize
let lastReceive = new Date().getTime();
let queue = [];
let homeStatus = {
    light: ['OFF', 'OFF', 'OFF']
};

function dateFormat(date) {
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;

    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

function log(text) {
    console.log(`${dateFormat(new Date())} ${text}`);
}

// MQTT connect
log('[MQTT] Initializing connection.');
const client = mqtt.connect(`mqtt://${CONFIG.mqtt.ip}`, {username: CONFIG.mqtt.username, password: CONFIG.mqtt.password});
client.on('connect', () => {
    client.subscribe(CONST.COMMAND_TOPIC, (err) => {
        if (err) {
            log(`[MQTT] Subscribe failed on ${CONST.COMMAND_TOPIC}.`);
        }
    });
    log('[MQTT] Connected.');
});

client.on('message', (topic, message) => {
    handleReceiveMQTTMessage(topic, message);
})


// EW11 connect
log('[Elfin-ew11] Initializing connection.');
const socket = new net.Socket();
socket.connect(CONFIG.ew11.port, CONFIG.ew11.ip, () => {
    log('[Elfin-ew11] connected.');
});
socket.setEncoding('hex');

socket.on('data', (data) => {
    handleReceiveEW11Data(data);
});

// handle MQTT message
function handleReceiveMQTTMessage(topic, message) {
    let topics = topic.split('/');
    let msg = message.toString();

    if (topics[0] === CONST.TOPIC_PREFIX) {
        if (topics[1] === 'light') {
            if (msg !== homeStatus['light'][topics[2]-1]) {
                log(`[MQTT] Receive ${topic} : ${msg}`);
                queue.push({
                    name: topics[1],
                    id: topics[2],
                    command: msg
                });
            }
        } else {
            log(`[MQTT] Error: can not find ${topic}`);
        }
    }
}

// handle EW11 data
function handleReceiveEW11Data(data) {
    lastReceive = new Date().getTime();

    let packets = [];
    for (let i=0; i<data.length; i+=16) {
        packets.push(data.substring(i, i+16).toUpperCase());
    }

    packets.forEach((packet) => {
        let device = CONST.DEVICE_STATE.find((device) => device.hex === packet);
        if (device) {
            let topic = `${CONST.TOPIC_PREFIX}/${device.name}/${device.id}/state`;
            client.publish(topic, device.state);
            homeStatus[device.name][device.id-1] = device.state;
        }
    });
}


function run() {
    if (queue.length === 0) return;

    let delay = new Date().getTime() - lastReceive;
    if (delay < CONFIG.sendDelay) return;

    let target = queue.shift();
    let command = CONST.DEVICE_COMMAND.find(device => device.name === target.name && device.id === target.id && device.command === target.command);
    let hex = Buffer.alloc(8, command.hex, 'hex');
    socket.write(hex, (err) => {
        if (err) {
            log('[Elfin-ew11] Error: failed to write Elfin-ew11');
        }
    });
    target.sentTime = new Date().getTime();
    log(`[Elfin-ew11] write ${target.name}${target.id} ${target.command}`);
    // queue.push(target);
}

setInterval(run, 100);
