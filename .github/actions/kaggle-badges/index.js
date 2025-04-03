const core = require('@actions/core');
const puppeteer = require('puppeteer');

async function run() {
    try {
        const username = core.getInput('username');
        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.goto(`https://www.kaggle.com/${username}`);

        // Wait for profile content to load
        await page.waitForSelector('.profile__content', { timeout: 10000 });

        // Create directories if they don't exist
        const fs = require('fs');
        const dirs = ['./kaggle-badges', './kaggle-plates'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Take screenshots of relevant sections
        await page.screenshot({
            path: './kaggle-badges/profile.png',
            clip: {
                x: 0,
                y: 0,
                width: 800,
                height: 400
            }
        });

        await browser.close();
        core.setOutput('status', 'success');
    } catch (error) {
        core.setFailed(error.message);
    }
}

run(); 