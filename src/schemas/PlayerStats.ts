import { Schema, model, Model } from "mongoose";
import Item from "../classes/Item";
import itemsMap from "../config/items";
import { Flags } from "../classes/Flags";
import Region from "../classes/Region";

interface IPlayerStats extends Document {
  userId: string;
  CP: number;
  CX: number;
  currentRegion: string;
  lastUpdated: Date;
  resources: { [itemId: string]: number };
  flags: { [itemId: string]: boolean }
}

interface IPlayerStatsModel extends Model<IPlayerStats> {
  createWithDefaults(userId: string): Promise<boolean | null>;
  getStats(userId: string): Promise<IPlayerStats | null>;
  updateStats(userId: string, CPChange: number): Promise<boolean | undefined>;
  updateRegion(userId: string, region: Region): void;
  updateInventory(userId: string, itemId: string, itemChange: number): Promise<void>;
  getAllStats(): Promise<IPlayerStats[] | null>;
  updateFlag(userId: string, flag: Flags, value: boolean): Promise<void>;
}

const emptyResourceObject = Item.initializeResourceQuantities(itemsMap);
const emptyFlagsObject: { [flagId: string]: boolean } = {};
for (let flag in Flags) {
  emptyFlagsObject[flag] = false;
}

const PlayerStatsSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  CP: {
    type: Number,
    default: 30,
  },
  CX: {
    type: Number,
    default: 0,
  },
  currentRegion: {
    type: String,
    default: "mineEntrance",
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  resources: {
    type: Object,
    default: emptyResourceObject,
  },
  flags: {
    type: Object,
    default: emptyFlagsObject,
  }
});

const PlayerStats = model<IPlayerStats, IPlayerStatsModel>("PlayerStats", PlayerStatsSchema);


PlayerStats.createWithDefaults = async function(userId: string) {
  try {
    let foundStats = await PlayerStats.findOne({ userId });

    if (!foundStats) {
      foundStats = new PlayerStats({ userId });
      console.log(`Created user ${userId}.`);
      await foundStats.save();
      return true;

  } else {
      console.log(`User ${userId} already exists.`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to create player stats for user ${userId}: ${error.stack}`);
    return null;
  }
}

PlayerStats.updateStats = async function(userId: string, CPChange: number) {
  const now = new Date();
  const userStats = await PlayerStats.getStats(userId);
  if (!userStats) {
    console.error(`Attempted to access non-existent or broken playerStats for ${userId} (CPChange: ${CPChange})`);
    return;
  }

  if (userStats.CP + CPChange < 0) {
    return false;
  }
  try {
    await PlayerStats.updateOne(
      { userId },
      { 
        $inc: { CP: CPChange }, 
        $set: { 
            lastUpdated: now, 
        }
      }
    );

    return true;
  } catch (error) {
    console.error(`Failed to update CP for user ${userId}: ${error.stack}`);
  }
}

PlayerStats.updateRegion = async function(userId: string, region: Region) {
  try {
    const now = new Date();
    await PlayerStats.updateOne(
      { userId },
      {
        $set: { 
          lastUpdated: now, 
          currentRegion: region.id
        }
      }
    );
  } catch (error) {
    console.error(`Failed to update region for user ${userId}: ${error.stack}`);
  }
}

PlayerStats.updateInventory = async function(userId: string, itemId: string, itemChange: number) {
  const userStats = await PlayerStats.getStats(userId);
  if (!userStats) {
    console.error(`Attempted to access non-existent or broken playerStats for ${userId} (${itemId}, ${itemChange})`);
    return;
  }

  if (userStats.resources[itemId] + itemChange < 0) {
    return;
  }

  const newResources = { ...userStats.resources };
  newResources[itemId] += itemChange;
  const now = new Date();
  await PlayerStats.updateOne(
    { userId },
    {
      $set: {
        resources: newResources,
        lastUpdated: now
      }
    }
  )
}

PlayerStats.getStats = async function(userId: string) {
  try {
    const playerStats = await PlayerStats.findOne({ userId });
    return playerStats ? playerStats.toObject() : null;
  } catch (error) {
    console.error(`Failed to retrieve player stats for user ${userId}: ${error.stack}`);
    return null;
  }
}

PlayerStats.getAllStats = async function() {
  try {
    let playerStatsList: IPlayerStats[] = [];
    const allPlayerStats = await PlayerStats.find({});
    allPlayerStats.forEach(player => {
      playerStatsList.push(player.toObject());
    });
    return playerStatsList ? playerStatsList : null;
  } catch (error) {
    console.error(`Failed to retrieve all player stats for user: ${error.stack}`);
    return null;
  }
}

PlayerStats.updateFlag = async function(userId: string, flag: Flags, value: boolean) {
  try {
    await PlayerStats.updateOne(
      { userId },
      {
        $set: { 
          [`flags.${flag}`]: value
        }
      }
    );
  } catch (error) {
    console.error(`Failed to update flags for user ${userId}: ${error.stack}`);
  }
}

export { PlayerStats, IPlayerStats };