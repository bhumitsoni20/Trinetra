import json

from channels.generic.websocket import AsyncWebsocketConsumer

ALERT_GROUP_NAME = "proctoring_alerts"


class AlertConsumer(AsyncWebsocketConsumer):
    async def connect(self) -> None:
        await self.channel_layer.group_add(ALERT_GROUP_NAME, self.channel_name)
        await self.accept()
        await self.send(
            text_data=json.dumps(
                {
                    "type": "system",
                    "message": "Realtime proctoring alerts connected.",
                }
            )
        )

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(ALERT_GROUP_NAME, self.channel_name)

    async def alert_message(self, event: dict) -> None:
        await self.send(text_data=json.dumps(event["payload"]))
