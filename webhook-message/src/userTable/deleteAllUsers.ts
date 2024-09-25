import axios from 'axios';

const BOTPRESS_URL = 'https://api.botpress.cloud/v1/tables/UserTable/rows/delete'; // Adjust the URL if necessary
const WORKSPACE_ID = 'wkspace_01J772Y91J3CPWGYYHSZ5APFSW';
const BOT_ID = '58b4e23e-6f7b-4f79-a937-6a10e6e67446'; // x-bot-id
const BOTPRESS_TOKEN = 'bp_pat_aXhFebEAEV7QUXVriDsoMnokqLpdVJ0VROcN'; 

async function deleteAllUsers() {
    try {
        console.log('Deleting all users...');

        // Make a request to delete all users in the table
        const response = await axios.post(BOTPRESS_URL, {
            ids: [], // Use an empty array for deleteAllRows to delete all users
            deleteAllRows: true, // Indicates that all rows should be deleted
        }, {
            headers: {
                'Authorization': `Bearer ${BOTPRESS_TOKEN}`,
                'x-bot-id': BOT_ID,
                'Content-Type': 'application/json',
            },
        });

        console.log('All users deleted successfully:', response.data);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error deleting users:', error.message);
        } else {
            console.error('An unknown error occurred while deleting users');
        }
    }
}

// Call the function to delete all users
deleteAllUsers().then((result) => console.log(result));
