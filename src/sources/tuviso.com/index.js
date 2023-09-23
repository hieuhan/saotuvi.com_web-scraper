const browserObject = require('../../browser');
const scraperObject = require('./scraper');

(async () => {
    
    let browser = await browserObject.startBrowser();

    if(browser != null)
    {
        await Promise.all([
            scraperObject.scraper(browser, 'https://tuviso.com/tu-vi/tu-vi/tu-vi-tuan/', 'Tử vi tuần'),
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/nhan-tuong/tuong-not-ruoi/nhan-tuong/tuong-tay/phong-thuy/phong-thuy-nha-o/phong-thuy/cac-cay-phong-thuy/phong-thuy/phong-thuy-cau-tai/phong-thuy/kien-thuc-phong-thuy/dat-ten-cho-con/', 'Cung Bạch Dương')
        ]);

        console.log('Đóng trình duyệt...');

        await browser.close();
    }

})().catch(error => {
    console.error(`Không thể tạo phiên bản trình duyệt => ${error}\n`);
});
