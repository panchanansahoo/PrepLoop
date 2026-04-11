import asyncio
import websockets

async def test():
    async with websockets.connect("ws://localhost:7860/ws") as ws:
        print("connected")
        await asyncio.sleep(1)
        async for msg in ws:
            print("got msg length:", len(msg))
            if len(msg) > 100: break

asyncio.run(test())
