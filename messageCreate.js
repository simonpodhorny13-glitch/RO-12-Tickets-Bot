module.exports = (
  client,
  {
    data,
    activeVoyage,
    voyageId,
    saveData,
    getUser,
    isValidSeat,
    getRouteData,
    getBasePrice,
    sendVoyageEmbed,
  }
) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const content = message.content;
    const channel = message.channel.name;
    const user = getUser(message.author.id);

    const hasPermission = message.member?.roles.cache.some((r) =>
      ["Owner", "Admin", "Captain"].includes(r.name)
    );

    /* ---------------- BALANCE ---------------- */

    if (content === "!balance") {
      return message.reply(`💰 Your balance: $${user.balance}`);
    }

    /* ---------------- CABIN MAP ---------------- */

    if (content === "!map cabins") {
      const isTaken = (id) => (data.cabinMap[id] ? "[X]" : "[ ]");

      return message.channel.send(
        `🛏️ **CABINS**\n\n` +
          `**ECONOMY**\n1A ${isTaken("1A")} 1B ${isTaken("1B")} 2A ${isTaken("2A")} 2B ${isTaken("2B")}\n\n` +
          `**FIRST**\n1C ${isTaken("1C")} 1D ${isTaken("1D")} 2C ${isTaken("2C")} 2D ${isTaken("2D")}\n\n` +
          `**DOUBLE**\n3A ${isTaken("3A")} 3B ${isTaken("3B")} 3C ${isTaken("3C")} 3D ${isTaken("3D")}`
      );
    }

    /* ---------------- SET VOYAGE ---------------- */

    if (content.startsWith("!setvoyage")) {
      if (channel !== "staff") return;

      const parts = content.split(" ");
      const from = parts[1];
      const to = parts[2];
      const routeCode = parts[3];

      if (!from || !to || !routeCode) {
        return message.reply("❌ Usage: !setvoyage A B 2 [time]");
      }

      const route = getRouteData(routeCode);

      activeVoyage.id = voyageId++;

      activeVoyage.from = from;
      activeVoyage.to = to;
      activeVoyage.length = route.name;
      activeVoyage.multiplier = route.multiplier;
      activeVoyage.ship = "RO-12";
      activeVoyage.captain = null;
      activeVoyage.fo = null;
      activeVoyage.gc = null;
      activeVoyage.departure = parts.slice(4).join(" ") || "TBA";
      activeVoyage.salesOpen = false;

      return message.channel.send(
        `🚢 VOYAGE CREATED: ${from} → ${to} (${route.name})`
      );
    }

    /* ---------------- CLAIM ---------------- */

    if (content.startsWith("!claim")) {
      if (!activeVoyage) return message.reply("❌ No active voyage.");

      const role = content.split(" ")[1];
      const roles = message.member?.roles.cache;

      if (role === "captain") {
        if (activeVoyage.captain)
          return message.reply("❌ Captain already assigned.");
        if (!roles.some((r) => r.name === "Captain"))
          return message.reply("❌ You are not a Captain.");
        activeVoyage.captain = message.author.id;
      } else if (role === "fo") {
        if (activeVoyage.fo)
          return message.reply("❌ First Officer already assigned.");
        if (!roles.some((r) => r.name === "First Officer"))
          return message.reply("❌ You are not a First Officer.");
        activeVoyage.fo = message.author.id;
      } else if (role === "gc") {
        if (activeVoyage.gc)
          return message.reply("❌ Ground Crew already assigned.");
        if (!roles.some((r) => r.name === "Ground Crew"))
          return message.reply("❌ You are not Ground Crew.");
        activeVoyage.gc = message.author.id;
      } else {
        return message.reply("❌ Invalid role.");
      }

      message.reply(`✅ ${role} assigned.`);

      if (
        activeVoyage.captain &&
        activeVoyage.fo &&
        activeVoyage.gc &&
        !activeVoyage.salesOpen
      ) {
        sendVoyageEmbed(client);
      }
    }

    /* ---------------- BOOKING ---------------- */

    if (
      content.startsWith("!bookcabin") ||
      content.startsWith("!seat")
    ) {
      if (!activeVoyage) return message.reply("❌ No active voyage.");
      if (!activeVoyage.salesOpen)
        return message.reply("❌ Booking not open yet.");

      const isCabin = content.startsWith("!bookcabin");
      const target = content.split(" ")[1];

      if (!target) return message.reply("❌ Missing input.");

      if (isCabin) {
        if (data.cabinMap[target] || user.cabin)
          return message.reply("❌ Cabin already taken.");

        const price = ["1C", "1D", "2C", "2D"].includes(target)
          ? getBasePrice() * 3
          : getBasePrice();

        if (user.balance < price)
          return message.reply(`❌ Not enough money ($${price})`);

        user.balance -= price;
        data.cabinMap[target] = message.author.id;
        user.cabin = target;
      } else {
        if (!isValidSeat(target))
          return message.reply("❌ Invalid seat (1A–20F)");

        if (data.seatMap[target] || user.seat)
          return message.reply("❌ Seat already taken.");

        const price = getBasePrice();

        if (user.balance < price)
          return message.reply(`❌ Not enough money ($${price})`);

        user.balance -= price;
        data.seatMap[target] = message.author.id;
        user.seat = target;
      }

      saveData();
      return message.reply(`✅ Booked ${target}!`);
    }

    /* ---------------- CANCEL ---------------- */

    if (content === "!cancel") {
      if (!activeVoyage) return message.reply("❌ No active voyage.");
      if (!user.seat && !user.cabin)
        return message.reply("❌ Nothing to cancel.");

      let refund = 0;

      if (user.seat) {
        refund += Math.floor(getBasePrice() * 0.9);
        delete data.seatMap[user.seat];
        user.seat = null;
      }

      if (user.cabin) {
        const p = ["1C", "1D", "2C", "2D"].includes(user.cabin)
          ? getBasePrice() * 3
          : getBasePrice();

        refund += Math.floor(p * 0.9);
        delete data.cabinMap[user.cabin];
        user.cabin = null;
      }

      user.balance += refund;
      saveData();

      return message.reply(`✅ Cancelled. Refund: $${refund}`);
    }

    /* ---------------- CANCEL VOYAGE ---------------- */

    if (content.startsWith("!cancelvoyage")) {
      if (!hasPermission)
        return message.reply("❌ No permission.");

      if (!activeVoyage)
        return message.reply("❌ No active voyage.");

      activeVoyage = null;
      data.seatMap = {};
      data.cabinMap = {};

      for (let id in data.users) {
        data.users[id].seat = null;
        data.users[id].cabin = null;
      }

      saveData();
      return message.channel.send("🚫 VOYAGE CANCELLED");
    }
  });
};
