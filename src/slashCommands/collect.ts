import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { SlashCommand } from "../types";
import regions from "../config/regions";
import resourcePools from "../config/resourcePools";
import { Tier, Tiers } from "../classes/Tiers";
import { Flags } from "../classes/Flags";
import { PlayerStats } from "../schemas/PlayerStats";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("collect")
    .setDescription("Costs 1CP | Collect resources from the current region"),
    execute: async (interaction) => {
        try {
            const playerStats = await PlayerStats.getStats(interaction.member!.user.id);

            if (!playerStats) {
                await interaction.reply({
                    content: "Use /gramble first"
                });
                return;
            }

            if (playerStats.currentRegion === "mineEntrance") {
                await interaction.reply({
                    content: "You can't do that in this region"
                });
                return;
            }

            const currentRegionResources = resourcePools[playerStats.currentRegion];
            if (!currentRegionResources) {
                console.error(`Could not find resource pool for region ${playerStats.currentRegion}`);
                return;
            }

            const validCPChange = await PlayerStats.updateStats(playerStats.userId, -1);
            if (!validCPChange) {
                await interaction.reply({
                    content: "haha poverty"
                });
                return;
            }
            const randomItem = currentRegionResources.getRandom();
            await PlayerStats.updateInventory(playerStats.userId, randomItem.id, 1);

            //unlock CX if Legendary or higher item found
            if (!playerStats.flags[Flags.CXUnlocked] && Tier.tiersSort[randomItem.tier] >= Tier.tiersSort[Tiers.Legendary]) {
                await PlayerStats.updateFlag(playerStats.userId, Flags.CXUnlocked, true);
            }

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`${randomItem.name}`)
                    .setDescription(`<@${interaction.member!.user.id}> found **${randomItem.name}!**`)
                    .setColor(Tier.getTierColor(randomItem.tier)!)
                    .setFields({ name: `${randomItem.tier} (${currentRegionResources.displayChances[randomItem.id]})`, value: randomItem.description })
                    .setImage(randomItem.image)
                    .setTimestamp()
                ]
            });

            playerStats
        } catch (error) {
            console.error(`Failed to handle collect command: ${error.message}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 2
}

export default command;