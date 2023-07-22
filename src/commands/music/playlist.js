const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
const { getThumb } = require('../../getThumb.js');
const { createCanvas, loadImage } = require('canvas')
const { drawStrokedText } = require('../../drawStrokedText.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Manage playlists'),
    async execute(interaction, client) {
        
    }
}