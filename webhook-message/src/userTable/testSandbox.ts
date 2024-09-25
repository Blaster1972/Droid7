import { UserApi, Configuration } from '../../mixitup-client';  // Adjust the path if needed

// Set up the configuration for the API client
const config = new Configuration({
    basePath: 'https://duckling-mighty-rhino.ngrok-free.app/api/v2',
});

// Instantiate the UserApi
const userApi = new UserApi(config);

// Example function to test a call to the API
async function testGetUsers(skip: string, pageSize: string) {
  try {
    const response = await userApi.usersGet(skip, pageSize);
    console.log(response.data);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Call the test function with example parameters
testGetUsers("0", "10"); // Adjust skip and pageSize as needed