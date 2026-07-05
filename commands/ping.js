module.exports = {
  name: "ping",

  async execute(message) {
    const latency = Date.now() - message.createdTimestamp;

    message.reply(`🏓 Pong: \`${latency}ms\``);
  }
};
