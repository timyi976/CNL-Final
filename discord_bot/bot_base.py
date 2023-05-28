import discord
from discord.ext import commands
import json

class Bot(commands.Bot):
    def __init__(self, config_path="config.json"):
        self.load_config(config_path)
        super().__init__(intents=discord.Intents.all(), command_prefix=self.command_prefix)
        self.prev_msg = dict() # (guild_id, channel_id) -> message

    def load_config(self, config_path):
        with open(config_path, "r") as f:
            self.config = json.load(f)
        self.command_prefix = self.config["command_prefix"]
        self.token = self.config["token"]
        if self.config["server_url"][-1] == "/":
            self.config["server_url"] = self.config["server_url"][:-1]

    async def load_default(self, bot):
        for ext in self.config["default_ext"]:
            await bot.load_extension("ext." + ext)

    # def run(self):
        # super().run(self.token)