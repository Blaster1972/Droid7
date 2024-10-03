import axios from 'axios';
import { z } from 'zod';

const MIXITUP_BASE_URL = 'https://duckling-mighty-rhino.ngrok-free.app';
const ENDPOINT_URL = `${MIXITUP_BASE_URL}/api/v2/users`;
const BOTPRESS_URL = 'https://api.botpress.cloud/v1/tables/UserTable/rows/upsert';
const BOT_ID = '58b4e23e-6f7b-4f79-a937-6a10e6e67446';
const BOTPRESS_TOKEN = 'bp_pat_aXhFebEAEV7QUXVriDsoMnokqLpdVJ0VROcN';

// Define the User type based on the expected API response structure
interface User {
  ID: string;
  LastActivity: string | null;
  LastUpdated: string | null;
  OnlineViewingMinutes: number | null;
  CurrencyAmounts: Record<string, number> | null;
  InventoryAmounts: Record<string, number> | null;
  StreamPassAmounts: Record<string, number> | null;
  CustomTitle: string | null;
  IsSpecialtyExcluded: boolean | null;
  Notes: string | null;
  PlatformData: Record<string, any> | null; // Updated to an object
}

const AmountsSchema = z.object({
  currencyAmounts: z.record(z.string(), z.number()).nullable().optional(),
  inventoryAmounts: z.record(z.string(), z.number()).nullable().optional(),
  streamPassAmounts: z.record(z.string(), z.number()).nullable().optional(),
});

const PlatformDataSchema = z.object({
  Platform: z.string().nullable(),
  ID: z.string().nullable(),
  Username: z.string().nullable(),
  DisplayName: z.string().nullable(),
  AvatarLink: z.string().nullable(),
  SubscriberBadgeLink: z.string().nullable(),
  RoleBadgeLink: z.string().nullable(),
  SpecialtyBadgeLink: z.string().nullable(),
  Roles: z.array(z.string()).nullable(),
  AccountDate: z.string().nullable(),
  FollowDate: z.string().nullable(),
  SubscribeDate: z.string().nullable(),
  SubscriberTier: z.number().nullable(),
});

const UserSchema = z.object({
  mixitupUserId: z.string(),
  userId: z.string(),
  lastActivity: z.string().nullable().optional(),
  lastUpdated: z.string().nullable().optional(),
  onlineViewingMinutes: z.number().nullable().optional(),
  currencyAmounts: z.record(z.string(), z.number()).nullable().optional(), // Make sure this is present
  inventoryAmounts: z.record(z.string(), z.number()).nullable().optional(), // Make sure this is present
  streamPassAmounts: z.record(z.string(), z.number()).nullable().optional(), // Make sure this is present
  customTitle: z.string().nullable().optional(),
  isSpecialtyExcluded: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  avatarLink: z.string().nullable().optional(),
});

async function fetchAllUsers(): Promise<User[]> {
  try {
    const response = await axios.get(ENDPOINT_URL);
    return response.data.Users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

async function upsertAllUsers() {
  try {
    console.log('Fetching all users...');
    const users = await fetchAllUsers();

    // Map user data and validate each user
    const mappedUsers = await Promise.all(users.map(async (user: User) => {
      const userEntries = []; // Create an array to hold individual platform entries

      if (user.PlatformData && typeof user.PlatformData === 'object') {
        for (const platformKey in user.PlatformData) {
          const platformData = user.PlatformData[platformKey];

          const mappedUserData = {
            mixitupUserId: user.ID,
            userId: user.ID,
            lastActivity: user.LastActivity ? new Date(user.LastActivity).toISOString() : null,
            lastUpdated: user.LastUpdated ? new Date(user.LastUpdated).toISOString() : null,
            onlineViewingMinutes: user.OnlineViewingMinutes,
            currencyAmounts: user.CurrencyAmounts || {},
            inventoryAmounts: user.InventoryAmounts || {},
            streamPassAmounts: user.StreamPassAmounts || {},
            customTitle: user.CustomTitle,
            isSpecialtyExcluded: user.IsSpecialtyExcluded,
            notes: user.Notes,
            platform: platformData.Platform || null, // Set platform name
            displayName: platformData.DisplayName || null,
            avatarLink: platformData.AvatarLink || null,
            platformID: platformData.ID || null, // Ensure PlatformID is set
            username: platformData.Username || null, // Ensure Username is set
          };
          // Validate the mapped user data
          UserSchema.parse(mappedUserData);
          userEntries.push(mappedUserData);
        }
      }

      return userEntries; // Return all mapped user entries for this user
    }));

    // Flatten the mappedUsers array
    const flattenedMappedUsers = mappedUsers.flat();

    // Upsert to Botpress using the mappedUsers
    const upsertResponse = await axios.post(
      BOTPRESS_URL,
      {
        rows: flattenedMappedUsers,
        keyColumn: 'mixitupUserId',
      },
      {
        headers: {
          'Authorization': `Bearer ${BOTPRESS_TOKEN}`,
          'x-bot-id': BOT_ID,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('All users upserted successfully:', upsertResponse.data);
    return { success: true, data: upsertResponse.data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('Validation Error:', error.errors);
      return { success: false, message: 'Validation error occurred', details: error.errors };
    } else if (error instanceof Error) {
      console.error('Error upserting users:', error.message);
      return { success: false, message: error.message };
    } else {
      console.error('An unknown error occurred while upserting users');
      return { success: false, message: 'Unknown error occurred' };
    }
  }
}

// Call the function to upsert all users
upsertAllUsers().then((result) => console.log(result));
