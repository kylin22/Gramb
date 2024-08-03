import chalk from "chalk"
import { ChatInputCommandInteraction, Guild, GuildMember, MessageComponentInteraction, PermissionFlagsBits, PermissionResolvable, PermissionsBitField, TextChannel } from "discord.js"
import GuildDB from "../schemas/Guild"
import { GuildOption } from "../types"
import mongoose from "mongoose";
import { PlayerStats, IPlayerStats } from "../schemas/PlayerStats";
import Region from "../classes/Region";
import { Flags } from "../classes/Flags";
import { Interface } from "readline";

type colorType = "text" | "variable" | "error"

const themeColors = {
    text: "#000000",
    variable: "#ff624d",
    error: "#f5426c"
}

export const getThemeColor = (color: colorType) => Number(`0x${themeColors[color].substring(1)}`)

export const color = (color: colorType, message: any) => {
    return chalk.hex(themeColors[color])(message)
}

export const checkPermissions = (member: GuildMember, permissions: Array<PermissionResolvable>) => {
    let neededPermissions: PermissionResolvable[] = []
    permissions.forEach(permission => {
        if (!member.permissions.has(permission)) neededPermissions.push(permission)
    })
    if (neededPermissions.length === 0) return null
    return neededPermissions.map(p => {
        if (typeof p === "string") return p.split(/(?=[A-Z])/).join(" ")
        else return Object.keys(PermissionFlagsBits).find(k => Object(PermissionFlagsBits)[k] === p)?.split(/(?=[A-Z])/).join(" ")
    })
}

export const sendTimedMessage = (message: string, channel: TextChannel, duration: number) => {
    channel.send(message)
        .then(m => setTimeout(async () => (await channel.messages.fetch(m)).delete(), duration))
    return
}

export const getGuildOption = async (guild: Guild, option: GuildOption) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.")
    let foundGuild = await GuildDB.findOne({ guildID: guild.id })
    if (!foundGuild) return null;
    return foundGuild.options[option]
}

export const setGuildOption = async (guild: Guild, option: GuildOption, value: any) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.")
    let foundGuild = await GuildDB.findOne({ guildID: guild.id })
    if (!foundGuild) return null;
    foundGuild.options[option] = value;
    foundGuild.save();
}

export const createPlayerStats = async (userId: string) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
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

export const updatePlayerStats = async (userId: string, CPChange: number) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    const now = new Date();
    const userStats = await getPlayerStats(userId);
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

export const updatePlayerRegion = async (userId: string, region: Region) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
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

export const updatePlayerInventory = async (userId: string, itemId: string, itemChange: number) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    const userStats = await getPlayerStats(userId);
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

export const getPlayerStats = async (userId: string): Promise<IPlayerStats | null> => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    try {
        const playerStats = await PlayerStats.findOne({ userId });
        return playerStats ? playerStats.toObject() : null;
    } catch (error) {
        console.error(`Failed to retrieve player stats for user ${userId}: ${error.stack}`);
        return null;
    }
}

export const getAllPlayerStats = async (): Promise<IPlayerStats[] | null> => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
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

export const updatePlayerFlag = async (userId: string, flag: Flags, value: boolean) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
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