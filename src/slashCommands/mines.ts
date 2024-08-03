import { SlashCommandBuilder, ChannelType, AttachmentBuilder, EmbedBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ActionRowBuilder, SelectMenuInteraction, Collector, CollectedInteraction, Attachment } from "discord.js"
import { getThemeColor } from "../utils/util";
import { SlashCommand } from "../types";
import { ButtonBuilder } from "@discordjs/builders";
import Region from "../classes/Region";
import regions from "../config/regions";
import { channel } from "diagnostics_channel";
import { PlayerStats } from "../schemas/PlayerStats";

console.log(require('discord.js').version);

const loadRegions = (currentRegion: Region) => {
    let regionOptions: StringSelectMenuOptionBuilder[] = [];
    let regionTravelPrices: Record<string, number> = {};
    regions.forEach(region => {
        if (region.travelPrice <= currentRegion.travelPrice) {
            regionTravelPrices[region.id] = 0;
        } else {
            regionTravelPrices[region.id] = region.travelPrice - currentRegion.travelPrice;
        }    
        regionOptions.push(new StringSelectMenuOptionBuilder()
            .setLabel(`${region.name}`)
            .setDescription(`Costs ${regionTravelPrices[region.id]}CP`)
            .setValue(region.id));
    });
    return { regionOptions, regionTravelPrices }
}   

const createRegionSelectMenu = (regionOptions: StringSelectMenuOptionBuilder[]) => {
    let select = new StringSelectMenuBuilder()
        .setCustomId(`${Date.now}`)
        .setPlaceholder("Select a Region")
        .setOptions(
            regionOptions
    );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(select);
    return row
}

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("region")
    .setDescription("Check or change your current region"),
    execute: async (interaction) => {
        try {
            const playerStats = await PlayerStats.getStats(interaction.member!.user.id);

            if (!playerStats) {
                await interaction.reply({
                    content: "Use /gramble first"
                });
                return;
            }

            const currentRegion = regions.find(region => region.id === playerStats?.currentRegion)!;
            
            let loadedRegions = loadRegions(currentRegion);
            const row1 = createRegionSelectMenu(loadedRegions.regionOptions);


            const embed = new EmbedBuilder()
                .setTitle("Region Select")
                .setDescription(`You are currently in ***${currentRegion.name}***\n\n${currentRegion.description}`)
                .setColor(getThemeColor("text"))
                .setImage(currentRegion.image)

            const response = await interaction.reply({
                embeds: [embed],
                components: [row1],
            });

            const collectorFilter = (i: any) => i.user.id === interaction.user.id
            while (true) {
                try {
                    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 }) as SelectMenuInteraction;
                    const selectedRegionId = confirmation.values[0];
                    const foundRegion = regions.find(region => region.id === selectedRegionId);

                    if (!foundRegion) {
                        console.log(`${selectedRegionId} region not found`);
                        return;
                    }

                    const validCPChange = await PlayerStats.updateStats(playerStats.userId, -loadedRegions.regionTravelPrices[`${foundRegion.id}`]);

                    if (!validCPChange) {
                        confirmation.deferUpdate();
                        await interaction.editReply({ embeds: [ embed.setDescription(`You cannot afford to go to *${foundRegion.name}*`) ] });
                        continue;
                    }

                    await PlayerStats.updateRegion(playerStats.userId, foundRegion);
            
                    loadedRegions = loadRegions(foundRegion);
                    const newRow1 = createRegionSelectMenu(loadedRegions.regionOptions);

                    confirmation.deferUpdate();
                    await interaction.editReply({ embeds: [ embed.setDescription(`You are currently in ***${foundRegion.name}***\n\n${foundRegion.description}`).setImage(foundRegion.image) ], components: [ newRow1 ] });
                } catch (error) {
                    await interaction.editReply({ embeds: [ embed.setDescription(`Selection timed out`).setImage(null) ], components: [] });
                    return;
                }
            }
        } catch (error) {
            console.error(`Failed to handle region command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 10
}

export default command;