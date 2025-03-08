import {Storage} from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

async function testCredentials() {
    console.log('- GOOGLE_CLOUD_PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('- GOOGLE_CLOUD_BUCKET_NAME:', process.env.GOOGLE_CLOUD_BUCKET_NAME);

    // Check if GOOGLE_CLOUD_KEY_JSON exists
    if (!process.env.GOOGLE_CLOUD_KEY_JSON) {
        console.error('ERROR: GOOGLE_CLOUD_KEY_JSON environment variable not found!');
        return;
    }

    console.log('GOOGLE_CLOUD_KEY_JSON exists, checking validity...');

    try {
        // Try to parse the JSON content
        const credentials = JSON.parse(process.env.GOOGLE_CLOUD_KEY_JSON);
        console.log('GOOGLE_CLOUD_KEY_JSON contains valid JSON');

        // Check for required fields
        if (!credentials.private_key || !credentials.client_email) {
            console.error('ERROR: GOOGLE_CLOUD_KEY_JSON is missing required fields!');
            return;
        }

        // Now try authentication
        console.log('Creating Storage client with credentials from env variable...');
        const storage = new Storage({
            credentials,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        });

        console.log('Getting bucket reference...');
        const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || '');

        console.log('Testing bucket access...');
        const [files] = await bucket.getFiles({maxResults: 1});
        console.log('Success! Found', files.length, 'files');
    } catch (error) {
        console.error('ERROR:', error.message);
        console.error('Full error:', error);
    }
}

testCredentials().catch(err => console.error('Test failed:', err));