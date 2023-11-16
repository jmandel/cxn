const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeNYT() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://www.nytimes.com/games/connections');

    // Check for and click the blocker card button if it exists
    const blockerButton = await page.$("body > .purr-blocker-card button");
    if (blockerButton) {
        await blockerButton.click();
    }

    // Click the "Play" button
    await page.click('button:text("Play")');

    // Wait for the items to load and select them
    await page.waitForSelector('.item', { state: 'visible' });
    const items = await page.$$eval('.item', elements => elements.map(el => el.innerText));

    // Format the grid data into a 4x4 array
    const grid4x4 = [];
    while (items.length) grid4x4.push(items.splice(0, 4));

    // Output to JSON file with today's date
    const fileName = `data/${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(fileName, JSON.stringify(grid4x4, null, 2));

    await browser.close();
}

scrapeNYT();
