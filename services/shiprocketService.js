const axios = require('axios');

let token = null;

const login = async () => {
    try {
        if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
            console.log('Shiprocket credentials not found, using mock mode');
            return 'mock-token';
        }
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
        });
        token = response.data.token;
        return token;
    } catch (error) {
        console.error('Shiprocket Login Failed', error.message);
        return null;
    }
};

const createShipment = async (order) => {
    if (!token) await login();

    // In production, call Shiprocket API here
    console.log(`Creating shipment for order ${order._id}`);

    // Mock Response
    return {
        shipment_id: `SHIP-${order._id}`,
        awb_code: `AWB-${Date.now()}`
    };
};

const trackShipment = async (awb) => {
    if (!token) await login();
    // Mock Response
    return { tracking_data: { status: 'In Transit', location: 'Delhi' } };
}

module.exports = { createShipment, trackShipment };
