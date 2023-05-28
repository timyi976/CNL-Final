from bot_base import Bot
import asyncio

bot = Bot()


@bot.event
async def on_ready():
    print("Bot is ready!")

async def main():
    async with bot:
        await bot.load_default(bot)
        await bot.start(bot.token)

asyncio.run(main())