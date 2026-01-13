const os = require('os');
const interfaces = os.networkInterfaces();

console.log('--- Network Interfaces ---');
Object.keys(interfaces).forEach((ifname) => {
    interfaces[ifname].forEach((iface) => {
        // skip internal (i.e. 127.0.0.1)
        if (iface.internal) return;

        // Only show IPv4 to keep it clean, but show all non-internal
        if (iface.family === 'IPv4') {
            console.log(`${ifname}: ${iface.address}`);
        }
    });
});
console.log('--------------------------');
