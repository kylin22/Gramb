import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor } from "../utils/util";
import { SlashCommand } from "../types";
import itemsMap from "../config/items";
import Item from "../classes/Item";
import { Tier, Tiers } from "../classes/Tiers";
import { PlayerStats } from "../schemas/PlayerStats";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory."),
    execute: async (interaction) => {
        try {
            const playerStats = await PlayerStats.getStats(interaction.member!.user.id);

            if (!playerStats) {
                await interaction.reply({
                    content: "Use /gramble first"
                });
                return;
            }

            
            let activeResources: Item[] = [];
            //TODO create pages if exceeding limit

            Object.entries(playerStats.resources).forEach(([itemId, quantity]) => {
                if (quantity > 0) {
                    activeResources.push(itemsMap.get(itemId)!);
                }
            });
            activeResources = Tier.sortTiers(activeResources);

            let description = "";
            let mythicSeperatorLineFlag = false;
            activeResources.forEach((item) => {
                const emoji = Tier.tierEmoji[item.tier];
                description += `> ${emoji} **${item.name}** (${playerStats.resources[item.id]})\n`
                if (!mythicSeperatorLineFlag && Tier.tiersSort[item.tier] >= Tier.tiersSort[Tiers.Mythic]) {
                    description += `\n### Mythic+\n\n`
                    mythicSeperatorLineFlag = true;
                }
            });

            
            interaction.reply(`
                ## ${interaction.member!.user.username}'s Inventory \n\n
                ${description}`);
        } catch (error) {
            console.error(`Failed to handle inventory command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;
