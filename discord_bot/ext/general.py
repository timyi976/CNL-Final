import discord
from discord.ext import commands
import random
import os

class General(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command()
    async def end_bot(self, ctx):
        await ctx.send("Ending bot...")
        await self.bot.logout()

    @commands.command()
    async def load_ext(self, ctx, ext):
        self.bot.load_extension(ext)
        await ctx.send(f"Loaded ext.{ext}")

    # reload
    @commands.command()
    async def reload_ext(self, ctx, ext):
        self.bot.reload_extension(ext)
        await ctx.send(f"Reloaded ext.{ext}")

async def setup(bot):
    await bot.add_cog(General(bot))
    print("general.py loaded")
    # return bot