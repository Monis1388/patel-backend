const axios = require('axios');

const DELHI_TOKEN = process.env.DELHIVERY_TOKEN;
const DELHI_URL = 'https://track.delhivery.com';

/**
 * Check if a pin code is serviceable by Delhivery
 */
const checkServiceability = async (pincode) => {
    try {
        let multiSourceData = {
            deliveryAvailable: false,
            city: null,
            state: null,
            source: null
        };

        // 1. Try Delhivery API
        if (DELHI_TOKEN) {
            try {
                const delhiUrl = `${DELHI_URL}/c/api/pin-codes/json/`;
                const response = await axios.get(delhiUrl, {
                    params: { filter_codes: pincode },
                    headers: { 'Authorization': `Token ${DELHI_TOKEN}` },
                    timeout: 5000 // 5 seconds timeout
                });

                if (response.data && response.data.delivery_codes && response.data.delivery_codes.length > 0) {
                    const details = response.data.delivery_codes[0].postal_code;
                    multiSourceData.deliveryAvailable = true;
                    multiSourceData.city = details.city || details.district;
                    multiSourceData.state = details.state_code;
                    multiSourceData.source = 'Delhivery';
                    return { status: true, ...multiSourceData };
                }
            } catch (err) {
                console.error('Delhivery API error:', err.message);
            }
        }

        // 2. Try Postal Pincode API Fallback (https://api.postalpincode.in/pincode/{pincode})
        try {
            const postalResponse = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
            if (postalResponse.data && postalResponse.data[0].Status === 'Success') {
                const postOffice = postalResponse.data[0].PostOffice[0];
                multiSourceData.deliveryAvailable = true;
                multiSourceData.city = postOffice.District;
                multiSourceData.state = postOffice.State;
                multiSourceData.source = 'PostalAPI';
                return { status: true, ...multiSourceData, message: 'Standard Logistics Available' };
            }
        } catch (err) {
            console.error('Postal API error:', err.message);
        }

        return { status: false, message: 'Pincode not serviceable' };
    } catch (error) {
        console.error('CheckServiceability Global error:', error.message);
        return { status: false, message: 'Shipping verification unavailable' };
    }
};

/**
 * Create a shipment with Delhivery
 */
const createShipment = async (order) => {
    try {
        if (!DELHI_TOKEN) {
            return { shipment_id: `MOCK-${order._id}`, awb_code: `MOCK-${Date.now()}` };
        }

        // Delhivery expects a specific format for shipments
        const payload = {
            format: 'json',
            shipments: [{
                add: order.shippingAddress.address,
                city: order.shippingAddress.city || 'Standard City',
                pin: order.shippingAddress.postalCode,
                phone: (order.shippingAddress.phone || order.user?.phone || '0000000000').toString().replace(/\D/g, '').slice(-10),
                name: order.shippingAddress.fullName || order.user?.name || 'Customer',
                order: order._id,
                payment_mode: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
                amount: order.totalPrice,
            }],
            pickup_location: {
                name: "Frame & Sunglasses",
                add: "Namuna Galli No. 4, Below Hotel Paras, Rajkamal Square",
                city: "Amravati",
                pin: "444601",
                phone: "9876543210"
            }

            // add your pickup address details here
        };

        const params = new URLSearchParams();
        params.append('format', 'json');
        params.append('data', JSON.stringify(payload));

        const response = await axios.post(`${DELHI_URL}/api/cmu/create.json`, params.toString(), {
            headers: {
                'Authorization': `Token ${DELHI_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Delhivery Shipment Creation error:', error.response?.data || error.message);
        return { error: true, message: error.message };
    }
};

/**
 * Track a shipment by AWB code
 */
const trackShipment = async (awb) => {
    try {
        if (!DELHI_TOKEN) {
            return { packages: [{ status: { status: 'In Transit (Mock)', location: 'Origin Hub' }, waybill: awb }] };
        }

        const response = await axios.get(`${DELHI_URL}/api/v1/packages/json/`, {
            params: { waybill: awb },
            headers: { 'Authorization': `Token ${DELHI_TOKEN}` }
        });

        return response.data;
    } catch (error) {
        console.error('Delhivery Tracking Failed', error.message);
        return null;
    }
}

/**
 * Create a Reverse Pickup (Return) with Delhivery
 * Called when Admin approves a return request.
 */
const createReversePickup = async (order) => {
    try {
        if (!DELHI_TOKEN) {
            // Mock response for dev/staging
            return { shipment_id: `MOCK-RETURN-${order._id}`, awb_code: `RETURN-MOCK-${Date.now()}` };
        }

        // Delhivery Reverse Pickup: 
        // 1. pickup_location should be the Customer details
        // 2. shipments destination (add) should be the Warehouse
        const payload = {
            format: 'json',
            shipments: [{
                name: 'Frame & Sunglasses Warehouse',
                add: 'Namuna Galli No. 4, Below Hotel Paras, Rajkamal Square',      // Warehouse destination
                city: 'Amravati',
                pin: '444601',
                phone: '9876543210',
                order: `RETURN-${order._id}`,
                payment_mode: 'Prepaid', // Merchant pays for the return shipment usually
                amount: 0,
            }],
            pickup_location: {
                name: order.shippingAddress.fullName || order.user?.name || 'Customer',
                add: order.shippingAddress.address,    // Customer pickup point
                city: order.shippingAddress.city,
                pin: order.shippingAddress.postalCode,
                phone: order.shippingAddress.phone || order.user?.phone || '0000000000'
            }
        };

        const params = new URLSearchParams();
        params.append('format', 'json');
        params.append('data', JSON.stringify(payload));

        const response = await axios.post(`${DELHI_URL}/api/cmu/create.json`, params.toString(), {
            headers: {
                'Authorization': `Token ${DELHI_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Delhivery Reverse Pickup error:', error.response?.data || error.message);
        return { error: true, message: error.message };
    }
};

module.exports = { checkServiceability, createShipment, trackShipment, createReversePickup };
