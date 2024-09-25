import axios from 'axios';
import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MIXITUP_BASE_URL = process.env.MIXITUP_BASE_URL;
const BOTPRESS_URL = 'https://api.botpress.cloud/v1/tables/UserTable/rows/upsert';
const BOT_ID = '58b4e23e-6f7b-4f79-a937-6a10e6e67446'; // x-bot-id
const BOTPRESS_TOKEN = 'bp_pat_aXhFebEAEV7QUXVriDsoMnokqLpdVJ0VROcN'; // Store your Botpress token in .env

// Define Zod schemas
const PlatformDataSchema = z.object({
  Twitch: z.object({
    Platform: z.string().nullable().optional(),
    ID: z.string().nullable().optional(),
    Username: z.string().nullable().optional(),
    DisplayName: z.string().nullable().optional(),
    AvatarLink: z.string().nullable().optional(),
    SubscriberBadgeLink: z.string().nullable().optional(),
    RoleBadgeLink: z.string().nullable().optional(),
    SpecialtyBadgeLink: z.string().nullable().optional(),
    Roles: z.array(z.string()).nullable().optional(),
    AccountDate: z.string().nullable().optional(), // Consider handling as a Date if needed
    FollowDate: z.string().nullable().optional(),
    SubscribeDate: z.string().nullable().optional(),
    SubscriberTier: z.number().nullable().optional(),
  }).nullable().optional(), // The Twitch object can be optional and nullable
});

// Define the User Schema
const UserSchema = z.object({
  mixitupUserId: z.string().nullable(),
  userId: z.string().nullable(), // Ensure userId is included
  notes: z.string().nullable(),
  customTitle: z.string().nullable(),
  lastUpdated: z.string().nullable(),
  lastActivity: z.string().nullable(),
  platformData: PlatformDataSchema.nullable(), // Incorporate the platformData schema here
  currencyAmounts: z.record(z.string(), z.number()).nullable(),
  inventoryAmounts: z.record(z.string(), z.number()).nullable(),
  streamPassAmounts: z.record(z.string(), z.number()).nullable(),
  isSpecialtyExcluded: z.boolean().nullable(),
  onlineViewingMinutes: z.number().nullable(),
});

export async function upsertUser(mixitupUserId: string) {
    try {
        console.log(`Fetching user data for mixitupUserId: ${mixitupUserId}`);

        // Fetch user data from MixItUp
        const response = await axios.get(`${MIXITUP_BASE_URL}/api/v2/users/${mixitupUserId}`);
        const userData = response.data;

        console.log('Fetched User Data:', userData);

        // Map the user data to match the table schema
        const mappedUserData = {
            mixitupUserId: userData.User.ID,
            userId: userData.User.ID, // Assuming you want to use mixitupUserId as userId
            lastActivity: userData.User.LastActivity,
            lastUpdated: userData.User.LastUpdated,
            onlineViewingMinutes: userData.User.OnlineViewingMinutes,
            currencyAmounts: userData.User.CurrencyAmounts,
            inventoryAmounts: userData.User.InventoryAmounts,
            streamPassAmounts: userData.User.StreamPassAmounts,
            customTitle: userData.User.CustomTitle,
            isSpecialtyExcluded: userData.User.IsSpecialtyExcluded,
            notes: userData.User.Notes,
            platformData: userData.User.PlatformData, // Keep original object
        };

        console.log('Mapped User Data:', JSON.stringify(mappedUserData, null, 2));

        // Validate the mappedUserData against UserSchema
        UserSchema.parse(mappedUserData); // This will throw if validation fails

        // Upsert to Botpress using the mappedUserData with mixitupUserId as key
        const upsertResponse = await axios.post(
            BOTPRESS_URL,
            {
                rows: [mappedUserData],
                keyColumn: 'mixitupUserId',  // Set this to use mixitupUserId as the key
            },
            {
                headers: {
                    'Authorization': `Bearer ${BOTPRESS_TOKEN}`,
                    'x-bot-id': BOT_ID,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('User data upserted successfully:', upsertResponse.data);

        // Return a structured response
        return { success: true, data: mappedUserData };
        } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            console.error('Validation Error:', error.errors);
            return { success: false, message: 'Validation error occurred', details: error.errors };
        } else if (error instanceof Error) {
            console.error('Error fetching or upserting user data:', error.message);
            return { success: false, message: error.message };
        } else {
            console.error('An unknown error occurred while fetching or upserting user data');
            return { success: false, message: 'Unknown error occurred' };
        }
    }
}
