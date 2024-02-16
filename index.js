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
    const checkboxValues = [];
    await page.waitForSelector('label input[type=checkbox]');
    const checkboxes = await page.$$('label input[type=checkbox]');
    for (const checkbox of checkboxes) {
        checkboxValues.push(await checkbox.inputValue());
    }

    // Format the grid data into a 4x4 array
    const grid4x4 = [];
    while (checkboxValues.length) grid4x4.push(checkboxValues.splice(0, 4));

    // Output to JSON file with today's date
    const fileName = `data/${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(fileName, JSON.stringify(grid4x4, null, 2));

    await browser.close();
}

scrapeNYT();
