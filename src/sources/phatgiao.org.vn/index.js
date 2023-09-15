const browserObject = require('../../browser');
const scraperObject = require('./scraper');

(async () => {
    
    let browser = await browserObject.startBrowser();

    if(browser != null)
    {
        await Promise.all([
            scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13352&page=1', 'Tin tức'),
            scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13378&page=1', 'Trong nước'),
            scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13379&page=1', 'Quốc tế'),
            scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13441&page=1', 'Tin Phật sự'),
            scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13455&page=1', 'Kinh Phật'),
            scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13354&page=1', 'Lời Phật dạy'),
            scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13499&page=1', 'Sống an vui'),
            scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13437&page=1', 'Đức Phật'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13361&page=1', 'Sách Phật giáo'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13460&page=1', 'Môi trường'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13367&page=1', 'Phật giáo thường thức'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13368&page=1', 'Giáo hội'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13353&page=1', 'Phật pháp và cuộc sống'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13508&page=1', 'Đạo Phật trong trái tim tôi'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13444&page=1', 'Nghiên cứu'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13461&page=1', 'Tâm linh Việt'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13356&page=1', 'Chùa Việt'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13458&page=1', 'Xuân Muôn Nơi'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13452&page=1', 'Chân dung từ bi'),
            // scraperObject.scraper(browser, 'https://phatgiao.org.vn/?mod=iframe&act=loadMoreCate&category_id=13456&page=1', 'Tăng sĩ')
        ]);

        console.log('Đóng trình duyệt...');

        await browser.close();
    }

})().catch(error => {
    console.error(`Không thể tạo phiên bản trình duyệt => ${error}\n`);
});