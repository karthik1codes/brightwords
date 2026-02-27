// Setup script to create .env file with Razorpay test keys
const fs = require('fs');
const path = require('path');

const envContent = `# Razorpay Configuration - Test Keys
# These are test keys for development/testing
RAZORPAY_KEY_ID=rzp_test_Rneu0aaeOPlIHD
RAZORPAY_KEY_SECRET=HK5dMB6B2Y4HLFdInB6FVbw3

# Server Configuration
PORT=3000

# Environment
NODE_ENV=development
`;

const envPath = path.join(__dirname, '.env');

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📍 Location: ' + envPath);
    console.log('\n🔑 Razorpay Test Keys configured:');
    console.log('   Key ID: rzp_test_Rneu0aaeOPlIHD');
    console.log('   Key Secret: HK5dMB6B2Y4HLFdInB6FVbw3');
    console.log('\n🚀 You can now start the backend server with: npm start');
} catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('\n📝 Please create .env file manually with the following content:');
    console.log('\n' + envContent);
}



