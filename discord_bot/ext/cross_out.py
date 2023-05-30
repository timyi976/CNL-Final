import discord
from discord.ext import commands
import random
import os
import requests

class CrossPlatOut(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.emojis = ['❌','1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']

    @commands.command()
    async def new(self, ctx, username):

        print(f"[Command] /new {username}")

        body = dict()
        body["plat"] = "discord"
        body["puid"] = str(ctx.guild.id)
        body["uid"] = username

        # set guild
        self.bot.guild = ctx.guild.id

        url = self.bot.config["server_url"] + "/new"

        # send post request to bot.config["server_url"] + "/new"
        r = requests.post(url, json=body)

        # if response is 200, send message to ctx.channel
        if r.status_code == 200:
            await ctx.send(f"[Bot] 🎉 Cross platform username set to [{username}] !")
        else:
            await ctx.send(f"[Bot] 😢 Username [{username}] already exists, try another one!")

    @commands.command()
    async def chat(self, ctx, target_uid):

        print(f"[Command] /chat {target_uid}")

        # create channel
        channel_name = target_uid

        success = await self.create_channel(ctx, channel_name)
        if not success:
            await ctx.send(f"[Bot] 😢 Channel to chat with [{target_uid}] already exists!")
        else:
            channel_id = await self.get_channel_id(ctx, channel_name)
            await ctx.send(f"[Bot] 📝 Channel to chat with {target_uid} created! Channel ID: {channel_id}")
            guild_id = ctx.guild.id

            # send post request to bot.config["server_url"] + "/chat"
            body = dict()
            body["plat"] = "discord"
            body["gid"] = str(channel_id)
            body["uid"] = target_uid

            url = self.bot.config["server_url"] + "/chat"

            r = requests.post(url, json=body)

            if r.status_code == 200:
                await ctx.send(f"[Bot]  Chat with [{target_uid}] starts at channel [{target_uid}]!")
            else:
                await ctx.send(f"[Bot] 😢 [/chat] Something went wrong!")
                # remove channel
                channel = discord.utils.get(ctx.guild.channels, name=channel_name)
                await channel.delete()
                await ctx.send(f"[Bot]  Channel [{channel_name}] deleted!")

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.author == self.bot.user or message.content[0] == "/":
            return
        
        body = dict()
        body["plat"] = "discord"
        body["gid"] = str(message.channel.id)
        body["msg"] = message.content

        # send post request to bot.config["server_url"] + "/send"
        url = self.bot.config["server_url"] + "/send"
        r = requests.post(url, json=body)

        # ignore response

    @commands.command()
    async def reply(self, ctx):
        if self.bot.prev_msg.get(ctx.channel.id) is None:
            await ctx.reply("[Bot] 😢 No previous message!")
            return
        
        # send post request to bot.config["server_url"] + "/recv"
        body = dict()
        prev_msg = self.bot.prev_msg[ctx.channel.id]
        body["msg"] = prev_msg

        r = requests.post(self.bot.config["server_url"] + "/reply", json=body)

        if r.status_code != 200:
            await ctx.reply(f"[Bot] 😢 [/reply] Something went wrong!")
        else:
            replies = r.json()["msg"]
            assert type(replies) == list
            msg = self.arrange_suggest_reply(replies, prev_msg)
            sent = await ctx.reply(msg)
            # react
            for i in range(len(replies)+1):
                await sent.add_reaction(self.emojis[i])
            
            def check(reaction, user):
                 return str(reaction.emoji) in self.emojis
            reaction, user = await self.bot.wait_for('reaction_add', check=check)

            if str(reaction.emoji) == self.emojis[0]:
                await ctx.reply("[Bot] 📤 No suggested replies sent!")
            else:
                chosen = replies[self.emojis.index(str(reaction.emoji))-1]

                body = dict()
                body["plat"] = "discord"
                body["gid"] = str(ctx.channel.id)
                body["msg"] = chosen

                # send post request to bot.config["server_url"] + "/send"
                r = requests.post(self.bot.config["server_url"] + "/send", json=body)

                await ctx.reply(f"[Bot] 📤 Suggested reply sent: {str(reaction.emoji)} {chosen} !")

    @commands.command()
    async def translate(self, ctx):
        if self.bot.prev_msg.get(ctx.channel.id) is None:
            await ctx.reply("[Bot] 😢 No previous message!")
            return
        
        # send post request to bot.config["server_url"] + "/recv"
        body = dict()
        prev_msg = self.bot.prev_msg[ctx.channel.id]
        body["msg"] = prev_msg

        r = requests.post(self.bot.config["server_url"] + "/translate", json=body)

        if r.status_code != 200:
            await ctx.reply(f"[Bot] 😢 [/translate] Something went wrong!")
        else:
            replies = r.json()["msg"]
            # assert type(replies) == str
            msg = self.arrange_translation(replies, prev_msg)
            sent = await ctx.reply(msg)

    async def create_channel(self, ctx, channel_name):
        guild = ctx.guild
        existing_channel = discord.utils.get(guild.channels, name=channel_name)
        if not existing_channel:
            await guild.create_text_channel(channel_name)
            return True
        else:
            return False
        
    async def get_channel_id(self, ctx, channel_name):
        guild = ctx.guild
        existing_channel = discord.utils.get(guild.channels, name=channel_name)
        if existing_channel:
            return existing_channel.id
        else:
            return None

    def arrange_suggest_reply(self, replies, prev_msg):
        msg = f'[Bot] 🤖 Following are the suggested replies to "{prev_msg}" by chatGPT:\n'
        for i in range(len(replies)):
            msg += f"\t{self.emojis[i+1]} {replies[i]}\n"
        msg += f"\t{self.emojis[0]} Reject!\n"
        msg += "❗ Note: You must react to one of the above choices!"
        return msg
    
    def arrange_translation(self, reply, prev_msg):
        msg = f'[Bot] 🌏 Following is the translation of "{prev_msg}" by chatGPT:\n'
        msg += f"\t{reply}"
        return msg

async def setup(bot):
    await bot.add_cog(CrossPlatOut(bot))
    print("cross_out.py loaded")
    # return bot