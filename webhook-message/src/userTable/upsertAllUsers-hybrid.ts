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
  PlatformData: any | null; 
}

// Define Zod schemas
const PlatformDataSchema = z.object({
  Platform: z.string().nullable().optional(),
  ID: z.string().nullable().optional(),
  Username: z.string().nullable().optional(),
  DisplayName: z.string().nullable().optional(),
  AvatarLink: z.string().nullable().optional(),
  SubscriberBadgeLink: z.string().nullable().optional(),
  RoleBadgeLink: z.string().nullable().optional(),
  SpecialtyBadgeLink: z.string().nullable().optional(),
  Roles: z.array(z.string()).nullable().optional(),
  AccountDate: z.string().nullable().optional(),
  FollowDate: z.string().nullable().optional(),
  SubscribeDate: z.string().nullable().optional(),
  SubscriberTier: z.number().nullable().optional(),
}).nullable().optional();

// Define the User Schema
const UserSchema = z.object({
  mixitupUserId: z.string().nullable(),
  notes: z.string().nullable(),
  customTitle: z.string().nullable(),
  lastUpdated: z.string().nullable(),
  lastActivity: z.string().nullable(),
  currencyAmounts: z.record(z.string(), z.number()).nullable(),
  inventoryAmounts: z.record(z.string(), z.number()).nullable(),
  streamPassAmounts: z.record(z.string(), z.number()).nullable(),
  isSpecialtyExcluded: z.boolean().nullable(),
  onlineViewingMinutes: z.number().nullable(),
  platformData: PlatformDataSchema, // Validate platformData with PlatformDataSchema
  platform: z.string().nullable(), // Flattened property
  username: z.string().nullable(), // Flattened property
  displayName: z.string().nullable(), // Flattened property
  avatarLink: z.string().nullable(), // Flattened property
  accountDate: z.string().nullable(), // Flattened property
  followDate: z.string().nullable(), // Flattened property
  subscribeDate: z.string().nullable(), // Flattened property
  subscriberTier: z.number().nullable(), // Flattened property
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

    const userPromises = users.map(async (user: User) => {
      const mappedUserData = {
        mixitupUserId: user.ID,
        lastActivity: user.LastActivity ? new Date(user.LastActivity).toISOString() : null,
        lastUpdated: user.LastUpdated ? new Date(user.LastUpdated).toISOString() : null,
        onlineViewingMinutes: user.OnlineViewingMinutes,
        currencyAmounts: user.CurrencyAmounts,
        inventoryAmounts: user.InventoryAmounts,
        streamPassAmounts: user.StreamPassAmounts,
        customTitle: user.CustomTitle,
        isSpecialtyExcluded: user.IsSpecialtyExcluded,
        notes: user.Notes,
        platformData: user.PlatformData, // Include PlatformData here
        platform: null, // Initialize platform to null
        username: null, // Initialize username to null
        displayName: null, // Initialize displayName to null
        avatarLink: null, // Initialize avatarLink to null
        accountDate: null, // Initialize accountDate to null
        followDate: null, // Initialize followDate to null
        subscribeDate: null, // Initialize subscribeDate to null
        subscriberTier: null, // Initialize subscriberTier to null
      };
      
      // Debugging: Log PlatformData to check structure
      console.log("PlatformData:", user.PlatformData);
      
      // Extract platform-specific data if PlatformData exists
      if (user.PlatformData && user.PlatformData['Twitch']) {
        const platformData = user.PlatformData['Twitch']; // Access data specifically for Twitch
      
        // Flatten the platform data into mappedUserData
        mappedUserData.platform = platformData.Platform || null;
        mappedUserData.username = platformData.Username || null;
        mappedUserData.displayName = platformData.DisplayName || null;
        mappedUserData.avatarLink = platformData.AvatarLink || null;
        mappedUserData.accountDate = platformData.AccountDate || null;
        mappedUserData.followDate = platformData.FollowDate || null;
        mappedUserData.subscribeDate = platformData.SubscribeDate || null;
        mappedUserData.subscriberTier = platformData.SubscriberTier || null;
      }
      
      // Check the mapped user data
      console.log("Mapped User Data:", mappedUserData);
      
      // Validate the mapped user data against UserSchema
      UserSchema.parse(mappedUserData);

      // Return the mapped user data
      return mappedUserData;
    });

    const mappedUsers = await Promise.all(userPromises);

    // Upsert to Botpress using the mappedUsers
    const upsertResponse = await axios.post(
      BOTPRESS_URL,
      {
        rows: mappedUsers,
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
