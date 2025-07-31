import os, openai, asyncio
openai.api_key = os.getenv("OPENAI_API_KEY", "")

async def get_bot_answer(prompt: str) -> str:
    resp = await openai.ChatCompletion.acreate(
        model="gpt-3.5-turbo-0125",
        messages=[
            {"role": "system", "content": "You are an undercover chatbot in a social deduction game."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=60,
    )
    return resp.choices[0].message.content.strip()