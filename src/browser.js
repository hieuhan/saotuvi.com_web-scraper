const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const {executablePath} = require('puppeteer');
const config = require('./config');

exports.startBrowser = async () => {
    let browser;

    try {
        puppeteer.use(pluginStealth());

        browser = await puppeteer.launch({
            headless: true,
            devtools: false,
            executablePath: config.EXECUTABLE_PATH || executablePath(),
            ignoreHTTPSErrors: true,
            //args: [ '--proxy-server=183.172.58.16:7891' ]
        });

    } catch (error) {
        browser = null;
	    console.log(`Không thể khởi chạy trình duyệt => error => ${error.name} - ${error.message} - ${error.stack}\n`);
    }

    return browser;
}