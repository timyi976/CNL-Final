import discord
import asyncio
from discord.ext import commands
from aiohttp import web

class CrossPlatIn(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    async def webserver(self):
        async def post_create_handler(request):
            # body of request if a json
            body = await request.json()
            uid = body['puid']
            guild = await self.bot.fetch_guild(int(uid))
            # create channel
            channel_name = self.random_str()
            await self.create_channel(guild, channel_name)
            channel_id = await self.get_channel_id(guild, channel_name)

            reply_body = dict()
            reply_body['gid'] = str(channel_id)
            return web.json_response(reply_body)
        
        async def post_send_handler(request):
            body = await request.json()
            gid = body['gid']
            gid = int(gid)
            msg = body['msg']

            # updadte previous msg
            self.bot.prev_msg[gid] = msg

            msg = "🗨 " + msg

            # guild_id, channel_id = utils.split_id(gid)
            channel = self.bot.get_channel(gid)
            await channel.send(msg)
            self.bot.previous_msg = msg
            return web.Response()
        
        app = web.Application()
        # app.add_routes([web.get('/', handler)])
        app.add_routes([web.post('/create', post_create_handler), web.post('/send', post_send_handler)])
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', 8765)
        await self.bot.wait_until_ready()
        await site.start()

    def __unload(self):
        asyncio.ensure_future(self.site.stop())

    async def create_channel(self, guild, channel_name):
        existing_channel = discord.utils.get(guild.channels, name=channel_name)
        if not existing_channel:
            await guild.create_text_channel(channel_name)
            return True
        else:
            return False
        
    async def get_channel_id(self, guild, channel_name):
        existing_channel = discord.utils.get(guild.channels, name=channel_name)
        if existing_channel:
            return existing_channel.id
        else:
            return None
        
    def random_str(self, length=5):
        import random
        import string
        return ''.join(random.choice(string.ascii_lowercase + string.digits) for i in range(length))


async def setup(bot):
    web = CrossPlatIn(bot)
    await bot.add_cog(web)
    print("cross_in.py loaded")
    bot.loop.create_task(web.webserver())