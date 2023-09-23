const browserObject = require('../../browser');
const scraperObject = require('./scraper');

(async () => {
    
    let browser = await browserObject.startBrowser();

    if(browser != null)
    {
        await Promise.all([
            scraperObject.scraper(browser, 'https://tuviso.com/tu-vi/tu-vi/tu-vi-tuan/', 'Tử vi tuần'),
            //scraperObject.scraper(browser, 'https://tuviso.com/tu-vi/tu-vi-thang/12-cung-hoang-dao/cung-bach-duong/', 'Cung Bạch Dương')
        ]);

        console.log('Đóng trình duyệt...');

        await browser.close();
    }

})().catch(error => {
    console.error(`Không thể tạo phiên bản trình duyệt => ${error}\n`);
});