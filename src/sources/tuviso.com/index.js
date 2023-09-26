const browserObject = require('../../browser');
const scraperObject = require('./scraper');

(async () => {
    
    let browser = await browserObject.startBrowser();

    if(browser != null)
    {
        await Promise.all([
            //scraperObject.scraper(browser, 'https://tuviso.com/tu-vi/tu-vi/tu-vi-tuan/', 'Tử vi tuần'),
            //scraperObject.scraper(browser, 'https://tuviso.com/tu-vi/tu-vi/tu-vi-tuan/tu-vi/tu-vi-thang/', 'Tử vi tháng'),
            scraperObject.scraper(browser, 'https://tuviso.com/12-cung-hoang-dao/tu-vi-ngay-12-cung-hoang-dao/', 'Tử vi ngày'),
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/nhan-tuong/tuong-not-ruoi/nhan-tuong/tuong-tay/phong-thuy/phong-thuy-nha-o/phong-thuy/cac-cay-phong-thuy/phong-thuy/phong-thuy-cau-tai/phong-thuy/kien-thuc-phong-thuy/dat-ten-cho-con/', 'Đặt Tên Cho Con'), OK
            //scraperObject.scraper(browser, 'https://tuviso.com/tag/tam-tai/',  null),
            //scraperObject.scraper(browser, 'https://tuviso.com/12-con-giap/tuoi-than/12-con-giap/tuoi-mao/xem-tuoi-sinh-con/', 'Xem Tuổi Sinh Con'), OK
            //scraperObject.scraper(browser, 'https://tuviso.com/12-con-giap/tuoi-than/12-con-giap/tuoi-mao/xem-tuoi-sinh-con/xem-tuoi/tuoi-xung-khac/', 'Tuổi xung khắc'), OK chờ xét lại
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/nhan-tuong/tuong-not-ruoi/nhan-tuong/tuong-tay/phong-thuy/phong-thuy-nha-o/', 'Phong thuỷ nhà ở'),
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/nhan-tuong/tuong-not-ruoi/nhan-tuong/tuong-tay/phong-thuy/phong-thuy-nha-o/phong-thuy/cac-cay-phong-thuy/phong-thuy/phong-thuy-cau-tai/', 'Phong thuỷ cầu tài'),
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/nhan-tuong/tuong-not-ruoi/nhan-tuong/tuong-tay/phong-thuy/phong-thuy-nha-o/phong-thuy/cac-cay-phong-thuy/', 'Cây phong thủy'), OK
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/nhan-tuong/tuong-not-ruoi/nhan-tuong/tuong-tay/phong-thuy/phong-thuy-nha-o/phong-thuy/cac-cay-phong-thuy/phong-thuy/phong-thuy-cau-tai/phong-thuy/kien-thuc-phong-thuy/', 'Kiến thức phong thuỷ'),
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/nhan-tuong/tuong-not-ruoi/nhan-tuong/tuong-tay/', 'Tướng tay'),
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/', 'Tướng mặt'),
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/', 'Tướng cơ thể'), OK
            //scraperObject.scraper(browser, 'https://tuviso.com/nhan-tuong/nhan-tuong/tuong-co-the/nhan-tuong/tuong-mat/nhan-tuong/tuong-not-ruoi/', 'Tướng nốt ruồi'),
            //scraperObject.scraper(browser, 'https://tuviso.com/12-con-giap/tuoi-than/12-con-giap/tuoi-mao/xem-tuoi-sinh-con/xem-tuoi/tuoi-xung-khac/', 'Tuổi xung khắc') OK
        ]);

        console.log('Đóng trình duyệt...');

        await browser.close();
    }

})().catch(error => {
    console.error(`Không thể tạo phiên bản trình duyệt => ${error}\n`);
});
