const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const userAgent = new UserAgent({ deviceCategory: 'desktop' });
const useProxy = require('puppeteer-page-proxy');
const logger = require('../../utils/logger');
const config = require('../../config');
const { crawlDataService } = require('../../services');
const { getParamUrl, setParamUrl, toSlug, stringToDate, sleep } = require('../../utils');
const SOURCE_DOMAIN = 'https://phatgiao.org.vn/';
const DATA_SOURCE = 'phatgiao.org.vn';

const scraperObject = {
    async scraper (browser, pageUrl, categoryName) {
        try {
            
            const page = await this.newPage(browser);

            if(page != null)
            {
                const responseStatus = await this.navigatePage(page, pageUrl);

                if(responseStatus && responseStatus == 200){

                    let currentPage = getParamUrl(pageUrl, 'page');

                    const scrapeCurrentPage = async (pageUrl) => {
                        
                        if(page.isClosed()){
                            return;
                        }

                        console.log(`Truy cập danh sách bài viết - Trang ${ currentPage }  =>\n${pageUrl}\n`);

                        logger.info(`Truy cập danh sách bài viết - Trang ${ currentPage }  =>\n${pageUrl}\n`);

                        const pageHtml = await page.content();
        
                        const $ = cheerio.load(pageHtml);

                        let newsItems = [];

                        const newsItemElements = $('.news-left-item');

                        if(newsItemElements.length > 0)
                        {
                            for (let index = 0; index < newsItemElements.length; index++) {
                                const element = newsItemElements[index],
                                titleElement = $(element).find('.news-left-item-title').first(),
                                summaryElement = $(element).find('.news-left-item-content').first(),
                                imageElement = $(element).find('.lazyload.img-loadmore').first(),
                                categoryElement = $(element).find('.news-left-item-time').first(),
                                publishedAtElement = $(element).find('span.alert-light').first();
                                
                                if(titleElement.length > 0 &&
                                    summaryElement.length > 0 &&
                                    imageElement.length > 0 &&
                                    categoryElement.length > 0 &&
                                    publishedAtElement.length > 0) {

                                    const sourceUrl = titleElement.attr('href'), title = this.getTitle(titleElement.text().trim()),
                                    imagePath = imageElement.attr('data-src') || imageElement.attr('src'),
                                    imageAlt = imageElement.attr('alt');
                                    let imageName = '';

                                    if(typeof imageAlt != 'undefined' && imageAlt.trim().length > 0 && imageAlt.trim() != 'Empty'){

                                        imageName = imageAlt.trim();

                                    }else{

                                        imageName = imagePath.split('/').pop();

                                    }

                                    if(typeof sourceUrl != 'undefined')
                                    {
                                        newsItems.push({
                                            Title: title,
                                            Summary: this.getSummary($, summaryElement),
                                            Url: toSlug(title),
                                            SourceUrl: sourceUrl,
                                            ImagePath: this.getImagePath(imagePath),
                                            ImageName: imageName,
                                            CurrentCategoryName: categoryName,
                                            CategoryName: categoryElement.text().trim(),
                                            PublishedAt: stringToDate(publishedAtElement.text().trim())
                                        });
                                    }
                                }
                            }
                        }

                        const pagePromise = (data) => new Promise(async (resolve, reject) => {
                            try {
                                
                                const newPage = await this.newPage(browser);

                                if(newPage != null)
                                {
                                    console.log(`Bài viết =>\n${data.SourceUrl}\n`);
        
                                    const responseStatus = await this.navigatePage(newPage, data.SourceUrl);
        
                                    if(responseStatus && responseStatus == 200)
                                    {
                                        const newPageHtml = await newPage.content();
        
                                        const $ = cheerio.load(newPageHtml);
        
                                        await parserData($, pageUrl, data);

                                        await this.closePage(newPage, data.SourceUrl);
        
                                        resolve(true);
                                    }
                                    else
                                    {
                                        console.log(`pagePromise =>\n${pageUrl}\n${data.SourceUrl}\nstatus code => ${responseStatus}`);

                                        logger.error(`pagePromise =>\n${pageUrl}\n${data.SourceUrl}\nstatus code => ${responseStatus}`);

                                        await crawlDataService.create({
                                            DataSource: DATA_SOURCE,
                                            DataUrl: data.SourceUrl,
                                            Message: responseStatus + '',
                                            StatusId: 3
                                        });

                                        return reject(false);
                                    }
                                }
                                else
                                {
                                    await crawlDataService.create({
                                        DataSource: DATA_SOURCE,
                                        DataUrl: data.SourceUrl,
                                        StatusId: 3
                                    });
                                    
                                    return reject(false);
                                }

                            } catch (error) {

                                console.log(`pagePromise => ${error.name} - ${error.message} - ${error.stack}`);

                                logger.error(`pagePromise => ${error.name} - ${error.message} - ${error.stack}`);

                                await crawlDataService.create({
                                    DataSource: DATA_SOURCE,
                                    DataUrl: data.SourceUrl,
                                    Message: error.toString(),
                                    StatusId: 3
                                });

                                return reject(false);
        
                            }

                            await sleep();
                        })

                        //Không có data thì đóng page
                        if(!Array.isArray(newsItems) || newsItems.length === 0)
                        {
                            //đóng page
                            await this.closePage(page, pageUrl);
                        }
                        else
                        {
                            for(index in newsItems)
                            {
                                await pagePromise(newsItems[index]);
                            }
                        }

                        //Lấy dữ liệu page tiếp theo
                        const pageParam = getParamUrl(pageUrl, 'page');

                        if(pageParam == null){
                            //đóng page
                            await this.closePage(page, pageUrl);

                            return;
                        }

                        currentPage = pageParam + 1;

                        const nextPageUrl = setParamUrl(pageUrl, 'page', currentPage);

                        if(nextPageUrl.length > 0){

                            await this.navigatePage(page, nextPageUrl);

                            return scrapeCurrentPage(nextPageUrl);
                        }

                        //đóng page
                        await this.closePage(page, pageUrl);
                    }

                    const parserData = async ($, pageUrl, data) => {
                        try {
                            
                            const elementContent = $('.content').first();

                            if(elementContent.length > 0){

                                elementContent.find('.box_ads_inserter').remove();
                                elementContent.find('div[id^="zone-"]').remove();
                                elementContent.find('script').remove();
                                elementContent.find('.audio_box').remove();
                                elementContent.find('.add_end_detail').remove();

                                await crawlDataService.create({
                                    DataSource: DATA_SOURCE,
                                    DataUrl: data.SourceUrl,
                                    Data: elementContent.html(),
                                    JSONData: JSON.stringify(data)
                                });
                            }

                        } catch (error) {
                            console.log(`parserData => ${ data.SourceUrl }\n ${error}`);
                        }
                    }

                    await scrapeCurrentPage(pageUrl);
                }
            }

        } catch (error) {
            console.log(`scraper => ${error}`);
        }
    },
    async newPage (browser, types = ['document']) {

        try {

            page = await browser.newPage();

            // const proxy = proxies[Math.floor(Math.random() * proxies.length)];

            // console.log(proxy)

            // await useProxy(page, proxy.proxy);

            await page.setUserAgent(userAgent.random().toString());

            await page.setRequestInterception(true);

            await page.authenticate({
                username: config.PROXY_USERNAME,
                password: config.PROXY_PASSWORD,
            });

            page.on('request', request => {
                if (!types.includes(request.resourceType()))
                return request.abort();

                request.continue();
            });

            return page;

        } catch (error) {
            console.log(`newPage => ${error.name} - ${error.message} - ${error.stack}`);

            return null;
        }
    },
    async navigatePage (page, pageUrl){
        let responseStatus; 

        if (!page.isClosed()) {

            await page.goto(`${pageUrl}`, { timeout: 0, waitUntil: 'networkidle2' }).then(response => responseStatus = response.status())
            .catch(e => console.log(`navigatePage('${pageUrl}') => ${e.name} - ${e.message} - ${e.stack}\n`));

        }

        return responseStatus;
    },
    async closePage (page, pageUrl) {

        if (!page.isClosed()) {

            await page.close().then( () => console.log(`Đóng page => ${pageUrl || ''}\n`) )
                .catch(error => console.error(`closePage => ${pageUrl || ''} error => ${error.name} - ${error.message} - ${error.stack}\n`));

        }
        
    },
    getSummary($, element){
        try {

            return $(element).children().remove().end().text().trim();

        } catch (error) {
            console.error(`getSummary => error::: ${error}\n`);

            return null;
        }
    },
    getTitle (title) {
        try {
            
            const index = title.indexOf('(');

            if(index != -1)
            {
                title = title.substring(0, index).trim();
            }

            return title;

        } catch (error) {

            console.error(`getTitle => ${error.name} - ${error.message} - ${error.stack}`);

            return null;
        }
        
    },
    getImagePath (path) {

        try {

            path = path.replace('/t.ex-cdn.com/' , '/i.ex-cdn.com/');
            path = path.replace(/\/resize\/\d+x\d+\//gm, '/');

            return path;

        } catch (error) {

            console.error(`getImagePath => ${error.name} - ${error.message} - ${error.stack}`);

            return null;
        }
    }
}

module.exports = scraperObject;