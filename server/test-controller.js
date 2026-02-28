const { ProductController } = require('./dist/modules/products/product.controller.js');

async function main() {
    const req = {
        body: {
            client_id: "5d0b58cf-aa25-4088-8032-4dbd913a4be4",
            brand: "Admin Added Brand",
            product_name: "Test Bug",
            product_link: "https://amazon.com",
            platform: "AMAZON",
            refund_amount: 100,
            total_slots: 10,
            daily_limit: 100,
            deadline: new Date().toISOString(),
            instructions: "test",
            is_public: true,
            product_image: "[]"
        }
    };

    let status = 200;
    let jsonPayload = null;
    const res = {
        status: (s) => { status = s; return res; },
        json: (d) => { jsonPayload = d; return res; }
    };

    // We will override console.error to capture the real error
    const oldError = console.error;
    let capturedError = null;
    console.error = (...args) => {
        capturedError = args;
        oldError(...args);
    };

    await ProductController.createCampaign(req, res);
    
    console.log("FINAL STATUS:", status);
    console.log("RESPONSE:", jsonPayload);
    if (capturedError) {
        console.log("CAPTURED REVEALED ERROR:", capturedError[1]);
    }
}
main();
