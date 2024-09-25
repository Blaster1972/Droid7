import { MixItUpChatMessage, Configuration, UserApi } from '../../mixitup-client'; // Adjust the import path if needed
import axios, { AxiosError } from 'axios';

// Set up the configuration for the API client
const config = new Configuration({
    basePath: 'https://duckling-mighty-rhino.ngrok-free.app/api/v2', // Replace with your API base path
});

// Instantiate the UserApi
const userApi = new UserApi(config);

// Function to send a message
async function sendMessage(message: string, platform: string = 'Twitch', sendAsStreamer: boolean = false) {
    const chatMessage: MixItUpChatMessage = {
        Message: message,
        Platform: platform,
        SendAsStreamer: sendAsStreamer,
    };

    try {
        const response = await axios.post(`${config.basePath}/chat/message`, chatMessage, { // Adjust the endpoint as needed
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Use type assertion to specify the error as AxiosError
        const axiosError = error as AxiosError;

        // Log the error based on whether it has a response
        if (axiosError.response) {
            console.error('Error sending message:', axiosError.response.data);
        } else {
            console.error('Error sending message:', axiosError.message);
        }
    }
}

// Get the message from command line arguments
const message = process.argv[2];
if (!message) {
    console.error('Please provide a message to send.');
    process.exit(1);
}

// Call the sendMessage function with the provided message
sendMessage(message);
