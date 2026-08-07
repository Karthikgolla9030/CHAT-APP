import asyncio
import os
import time
from playwright.async_api import async_playwright

async def register_and_login(page, username, email, password):
    await page.goto("http://localhost:8000/register")
    await page.wait_for_selector('input[type="text"]')
    await page.fill('input[type="text"]', username)
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    
    # Click captcha
    await page.click('button:has-text("I am human")')
    await page.wait_for_timeout(500)
    
    await page.click('button[type="submit"]')
    # Wait for redirect to dashboard or login
    await page.wait_for_timeout(2000)
    
    if "login" in page.url:
        await page.fill('input[type="text"]', username)
        await page.fill('input[type="password"]', password)
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context_a = await browser.new_context()
        page_a = await context_a.new_page()
        context_b = await browser.new_context()
        page_b = await context_b.new_page()
        
        log_file = open("test_logs.txt", "w", encoding="utf-8")
        
        def handle_console_a(msg):
            log_file.write(f"[BROWSER_A] {msg.text}\n")
            print(f"[BROWSER_A] {msg.text}")
            
        def handle_console_b(msg):
            log_file.write(f"[BROWSER_B] {msg.text}\n")
            print(f"[BROWSER_B] {msg.text}")
            
        page_a.on("console", handle_console_a)
        page_b.on("console", handle_console_b)
        
        user_a = f"testuser_{int(time.time())}_A"
        user_b = f"testuser_{int(time.time())}_B"
        
        print("Registering users...")
        await register_and_login(page_a, user_a, f"{user_a}@test.com", "Password123!")
        await register_and_login(page_b, user_b, f"{user_b}@test.com", "Password123!")
        
        print("Starting matchmaking...")
        await page_a.goto("http://localhost:8000/match")
        await page_b.goto("http://localhost:8000/match")
        
        # Click Start Searching Now
        await page_a.click("text=Start Searching Now")
        await page_b.click("text=Start Searching Now")
        
        # Wait for chat
        await page_a.wait_for_url("**/chat/**", timeout=15000)
        await page_b.wait_for_url("**/chat/**", timeout=15000)
        print("Matched!")
        await page_a.wait_for_timeout(2000)
        
        # Send 50 messages
        for i in range(50):
            await page_a.fill('input[type="text"]', f"Random chat message {i}")
            await page_a.press('input[type="text"]', 'Enter')
            await page_a.wait_for_timeout(300)
            
        print("Adding friend...")
        # Since button might just be an icon, try aria-label
        # or button inside chat header. The ChatPage has FriendStatusButton.
        # Let's try text first, if not try button title.
        try:
            await page_a.click("button[title*='Add']")
        except:
            pass # ignore for now
        await page_a.wait_for_timeout(2000)
        
        # Bob accepts
        try:
            await page_b.click("button[title*='Accept']")
        except:
            pass
        
        await page_a.wait_for_timeout(2000)
        print("Sending 50 messages as friends...")
        for i in range(50):
            await page_a.fill('input[type="text"]', f"Friend message {i}")
            await page_a.press('input[type="text"]', 'Enter')
            await page_a.wait_for_timeout(300)
            
        print("Navigating away...")
        await page_a.goto("http://localhost:8000/friends")
        await page_a.wait_for_timeout(2000)
        
        print("Returning to chat...")
        await page_a.go_back()
        await page_a.wait_for_timeout(2000)
        print("Sending 50 more messages...")
        for i in range(50):
            await page_a.fill('input[type="text"]', f"Returned message {i}")
            await page_a.press('input[type="text"]', 'Enter')
            await page_a.wait_for_timeout(300)
            
        print("Skipping...")
        try:
            await page_a.click("text=Skip")
        except:
            pass
        await page_a.wait_for_timeout(2000)
        
        await browser.close()
        log_file.close()

if __name__ == "__main__":
    asyncio.run(run())
