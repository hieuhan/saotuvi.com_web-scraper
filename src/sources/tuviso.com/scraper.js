const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const userAgent = new UserAgent({ deviceCategory: 'desktop' });
const logger = require('../../utils/logger');
const config = require('../../config');
const { crawlDataService } = require('../../services');
const { getParamUrl, setParamUrl, toSlug, stringToDate, sleep } = require('../../utils');
const SOURCE_DOMAIN = 'https://tuviso.com/';
const DATA_SOURCE = 'tuviso.com';

const scraperObject = {
    async scraper(browser, pageUrl, categoryName) {
        try {

            const page = await this.newPage(browser);

            if (page != null) {

                const responseStatus = await this.navigatePage(page, pageUrl);

                if (responseStatus && responseStatus == 200) {

                    const scrapeCurrentPage = async (pageUrl) => {

                        if (page.isClosed()) {
                            return;
                        }

                        const pageHtml = await page.content();

                        const $ = cheerio.load(pageHtml);

                        let newsItems = [];

                        const firstPostElement = $('.first-post').first();

                        if (firstPostElement.length > 0) {
                            const titleFirstPostElement = $(firstPostElement).find('.first-post-info > a').first(),
                                summaryFirstPostElement = $(firstPostElement).find('.first-post-info p').first(),
                                imageFirstPostElement = $(firstPostElement).find('.first-post-thumbnail img').first();

                            if (titleFirstPostElement.length > 0 &&
                                summaryFirstPostElement.length > 0 &&
                                imageFirstPostElement.length > 0) {

                                const firstPostSourceUrl = titleFirstPostElement.attr('href'), firstPostTitle = this.getTitle(titleFirstPostElement.text().trim()),
                                    firstPostImagePath = imageFirstPostElement.attr('data-src') || imageFirstPostElement.attr('src'),
                                    firstPostImageAlt = imageFirstPostElement.attr('alt');
                                let firstPostImageName = '';

                                if (typeof firstPostImageAlt != 'undefined' && firstPostImageAlt.trim().length > 0 && firstPostImageAlt.trim() != 'Empty') {

                                    firstPostImageName = firstPostImageAlt.trim();

                                } else {

                                    firstPostImageName = firstPostImagePath.split('/').pop().replace('.webp', '');

                                }

                                if (typeof firstPostSourceUrl != 'undefined') {
                                    newsItems.push({
                                        Title: firstPostTitle,
                                        Summary: summaryFirstPostElement.text().trim(),
                                        Url: toSlug(firstPostTitle),
                                        SourceUrl: firstPostSourceUrl,
                                        ImagePath: this.getImagePath(firstPostImagePath),
                                        ImageName: firstPostImageName,
                                        CurrentCategory: categoryName,
                                        CategoryName: null,
                                        PublishedAt: null
                                    });
                                }

                            }
                        }

                        const postsLimitElements = $('.posts-limit-2 .post-carousel');

                        if (postsLimitElements.length > 0) {

                            for (let index = 0; index < postsLimitElements.length; index++) {
                                const postsLimitElement = postsLimitElements[index],
                                    titlePostsLimitElement = $(postsLimitElement).find('.post-carousel-title').first(),
                                    imagePostsLimitElement = $(postsLimitElement).find('.post-carousel-thumbnail img').first();

                                if (titlePostsLimitElement.length > 0 &&
                                    imagePostsLimitElement.length > 0) {

                                    const postsLimitSourceUrl = titlePostsLimitElement.attr('href'), postsLimitTitle = this.getTitle(titlePostsLimitElement.text().trim()),
                                        postsLimitImagePath = imagePostsLimitElement.attr('data-src') || imagePostsLimitElement.attr('src'),
                                        postsLimitImageAlt = imagePostsLimitElement.attr('alt');
                                    let postsLimitImageName = '';

                                    if (typeof postsLimitImageAlt != 'undefined' && postsLimitImageAlt.trim().length > 0 && postsLimitImageAlt.trim() != 'Empty') {

                                        postsLimitImageName = postsLimitImageAlt.trim();

                                    } else {

                                        postsLimitImageName = postsLimitImagePath.split('/').pop().replace('.webp', '');

                                    }

                                    if (typeof postsLimitSourceUrl != 'undefined') {
                                        newsItems.push({
                                            Title: postsLimitTitle,
                                            Summary: null,
                                            Url: toSlug(postsLimitTitle),
                                            SourceUrl: postsLimitSourceUrl,
                                            ImagePath: this.getImagePath(postsLimitImagePath),
                                            ImageName: postsLimitImageName,
                                            CurrentCategory: categoryName,
                                            CategoryName: null,
                                            PublishedAt: null
                                        });
                                    }
                                }
                            }

                        }

                        const newsItemElements = $('.main-archive').find('.post-archive');

                        if (newsItemElements.length > 0) {
                            for (let index = 0; index < newsItemElements.length; index++) {
                                const element = newsItemElements[index],
                                    titleElement = $(element).find('.post-archive-title').first(),
                                    summaryElement = $(element).find('.post-archive-meta p').first(),
                                    imageElement = $(element).find('.post-archive-thumbnail img').first(),
                                    categoryElement = $(element).find('.post-archive-category').first();

                                //$(element).addClass('crawled');

                                if (titleElement.length > 0 &&
                                    summaryElement.length > 0 &&
                                    imageElement.length > 0 &&
                                    categoryElement.length > 0) {

                                    const sourceUrl = titleElement.attr('href'), title = this.getTitle(titleElement.text().trim()),
                                        imagePath = imageElement.attr('data-src') || imageElement.attr('src'),
                                        imageAlt = imageElement.attr('alt');
                                    let imageName = '';

                                    if (typeof imageAlt != 'undefined' && imageAlt.trim().length > 0 && imageAlt.trim() != 'Empty') {

                                        imageName = imageAlt.trim();

                                    } else {

                                        imageName = imagePath.split('/').pop().replace('.webp', '');

                                    }

                                    if (typeof sourceUrl != 'undefined') {
                                        newsItems.push({
                                            Title: title,
                                            Summary: summaryElement.text().trim(),
                                            Url: toSlug(title),
                                            SourceUrl: sourceUrl,
                                            ImagePath: this.getImagePath(imagePath),
                                            ImageName: imageName,
                                            CurrentCategory: categoryName,
                                            CategoryName: categoryElement.text().trim(),
                                            PublishedAt: null
                                        });
                                    }
                                }
                            }
                        }

                        const pagePromise = (data) => new Promise(async (resolve, reject) => {
                            try {

                                console.log(`pagePromise => ${data.SourceUrl}\n`);

                                const newPage = await this.newPage(browser);

                                if (newPage != null) {

                                    console.log(`Bài viết =>\n${data.SourceUrl}\n`);

                                    const responseStatus = await this.navigatePage(newPage, data.SourceUrl);

                                    if (responseStatus && responseStatus == 200) {

                                        const newPageHtml = await newPage.content();

                                        const $ = cheerio.load(newPageHtml);

                                        await parserData($, pageUrl, data);

                                        await this.closePage(newPage, data.SourceUrl);

                                        resolve(true);

                                    }
                                    else {

                                        console.log(`pagePromise =>\n${pageUrl}\n${data.SourceUrl}\nstatus code => ${responseStatus}`);

                                        logger.error(`pagePromise =>\n${pageUrl}\n${data.SourceUrl}\nstatus code => ${responseStatus}`);

                                        // await crawlDataService.create({
                                        //     DataSource: DATA_SOURCE,
                                        //     DataUrl: data.SourceUrl,
                                        //     Message: responseStatus + '',
                                        //     StatusId: 3
                                        // });

                                        return reject(false);
                                    }
                                }
                                else {
                                    // await crawlDataService.create({
                                    //     DataSource: DATA_SOURCE,
                                    //     DataUrl: data.SourceUrl,
                                    //     StatusId: 3
                                    // });

                                    return reject(false);
                                }

                            } catch (error) {

                                console.log(`pagePromise => ${error.name} - ${error.message} - ${error.stack}`);

                                logger.error(`pagePromise => ${error.name} - ${error.message} - ${error.stack}`);

                                // await crawlDataService.create({
                                //     DataSource: DATA_SOURCE,
                                //     DataUrl: data.SourceUrl,
                                //     Message: error.toString(),
                                //     StatusId: 3
                                // });

                                return reject(false);

                            }

                            await sleep();
                        })

                        let newsItemsLoadMore = [], finished = false, startLoadMore = true;

                        page.on('response', async response => {

                            if (response.url().includes('https://tuviso.com/ajax_post')) {

                                startLoadMore = false;

                                console.log(`startLoadMore => ${startLoadMore}\n`);

                                let responseText = await response.text();

                                //console.log(`responseText => ${responseText}\n`);

                                if (responseText.length > 0) {

                                    const $ = cheerio.load(responseText);

                                    const newsItemElements = $('.post-archive');

                                    if (newsItemElements.length > 0) {
                                        for (let index = 0; index < newsItemElements.length; index++) {
                                            const element = newsItemElements[index],
                                                titleElement = $(element).find('.post-archive-title').first(),
                                                summaryElement = $(element).find('.post-archive-meta p').first(),
                                                imageElement = $(element).find('.post-archive-thumbnail img').first(),
                                                categoryElement = $(element).find('.post-archive-category').first();

                                            //$(element).addClass('crawled');

                                            if (titleElement.length > 0 &&
                                                summaryElement.length > 0 &&
                                                imageElement.length > 0 &&
                                                categoryElement.length > 0) {

                                                const sourceUrl = titleElement.attr('href'), title = this.getTitle(titleElement.text().trim()),
                                                    imagePath = imageElement.attr('data-src') || imageElement.attr('src'),
                                                    imageAlt = imageElement.attr('alt');
                                                let imageName = '';

                                                if (typeof imageAlt != 'undefined' && imageAlt.trim().length > 0 && imageAlt.trim() != 'Empty') {

                                                    imageName = imageAlt.trim();

                                                } else {

                                                    imageName = imagePath.split('/').pop().replace('.webp', '');

                                                }

                                                if (typeof sourceUrl != 'undefined') {
                                                    console.log(`newsItemsLoadMore push => ${sourceUrl}`);
                                                    //console.log(`newsItemsLoadMore.length => ${newsItemsLoadMore.length}`)
                                                    newsItemsLoadMore.push({
                                                        Title: title,
                                                        Summary: summaryElement.text().trim(),
                                                        Url: toSlug(title),
                                                        SourceUrl: sourceUrl,
                                                        ImagePath: this.getImagePath(imagePath),
                                                        ImageName: imageName,
                                                        CurrentCategory: categoryName,
                                                        CategoryName: categoryElement.text().trim(),
                                                        PublishedAt: null
                                                    });
                                                }
                                            }
                                        }

                                        //console.log(newsItemsLoadMore)
                                        // console.log('loop newsItemsLoadMore');

                                        // for (index in newsItemsLoadMore) {
                                        //     await pagePromise(newsItemsLoadMore[index]);
                                        // }

                                        startLoadMore = true;
                                    }

                                }else{

                                    //finished = true;
                                    startLoadMore = false;

                                    console.log(`finished => ${finished}`);
                                }

                                await page.evaluate(() => window.stop());

                            }

                        })

                        //Không có data thì đóng page
                        if (!Array.isArray(newsItems) || newsItems.length === 0) {
                            //đóng page
                            await this.closePage(page, pageUrl);
                        }
                        else {
                            for (index in newsItems) {
                                await pagePromise(newsItems[index]);
                            }
                        }

                        console.log("click view more to load entire list");

                        console.log(`finished => ${finished}`);

                        while (startLoadMore) {
                            try {

                                await sleep();

                                await page.$eval('#postMore', (el) => {

                                    console.log(`el.innerText => ${el.innerText}`);

                                    if(el.innerText == 'Đã hết dữ liệu !'){

                                        return;

                                    }else{

                                        el.scrollIntoView();

                                        el.click();

                                    }

                                });

                                //await page.waitForTimeout(500);

                                console.log("loading...");

                                await sleep();

                            } catch (e) {
                                console.error(e);
                                console.log("done");
                                break;
                            }
                        }

                        if (Array.isArray(newsItemsLoadMore) && newsItemsLoadMore.length > 0) {

                            for (index in newsItemsLoadMore) {
                                await pagePromise(newsItemsLoadMore[index]);
                            }
                        }

                        //đóng page
                        await this.closePage(page, pageUrl);

                    }

                    const parserData = async ($, pageUrl, data) => {
                        try {

                            const elementContent = $('.card-body').first();

                            if (elementContent.length > 0) {

                                //elementContent.find('.slide-in-post').remove();
                                //elementContent.find('.table-mucluc').remove();
                                //elementContent.find('.box-author-info').remove();
                                //elementContent.find('.single-footer').remove();
                                //elementContent.find('.fb-comments').remove();

                                await crawlDataService.create({
                                    DataSource: DATA_SOURCE,
                                    DataUrl: data.SourceUrl,
                                    Data: elementContent.html(),
                                    JSONData: JSON.stringify(data)
                                });
                            }

                            //await sleep();

                        } catch (error) {
                            console.log(`parserData => ${data.SourceUrl}\n ${error}`);
                        }
                    }

                    await scrapeCurrentPage(pageUrl);

                }

            }

        } catch (error) {
            console.log(`scraper => ${error}`);
        }
    },
    async newPage(browser, types = ['document', 'xhr', 'fetch', 'script']) {

        try {

            page = await browser.newPage();

            await page.setUserAgent(userAgent.random().toString());

            //await page.setRequestInterception(true);

            await page.authenticate({
                username: config.PROXY_USERNAME,
                password: config.PROXY_PASSWORD,
            });

            // page.on('request', request => {
            //     if (!types.includes(request.resourceType()))
            //     return request.abort();

            //     request.continue();
            // });

            return page;

        } catch (error) {
            console.log(`newPage => ${error.name} - ${error.message} - ${error.stack}`);

            return null;
        }
    },
    async navigatePage(page, pageUrl) {
        let responseStatus;

        if (!page.isClosed()) {

            await page.goto(`${pageUrl}`, { timeout: 0, waitUntil: 'networkidle2' }).then(response => responseStatus = response.status())
                .catch(e => console.log(`navigatePage('${pageUrl}') => ${e.name} - ${e.message} - ${e.stack}\n`));

        }

        return responseStatus;
    },
    async closePage(page, pageUrl) {

        if (!page.isClosed()) {

            await page.close().then(() => console.log(`Đóng page => ${pageUrl || ''}\n`))
                .catch(error => console.error(`closePage => ${pageUrl || ''} error => ${error.name} - ${error.message} - ${error.stack}\n`));

        }

    },
    getSummary($, element) {
        try {

            return $(element).children().remove().end().text().trim();

        } catch (error) {
            console.error(`getSummary => error::: ${error}\n`);

            return null;
        }
    },
    getTitle(title) {
        try {

            const index = title.indexOf('(');

            if (index != -1) {
                title = title.substring(0, index).trim();
            }

            return title;

        } catch (error) {

            console.error(`getTitle => ${error.name} - ${error.message} - ${error.stack}`);

            return null;
        }

    },
    getImagePath(path) {

        try {

            path = path.replace(/-\d+x\d+\.webp/gm, '.webp');

            return path;

        } catch (error) {

            console.error(`getImagePath => ${error.name} - ${error.message} - ${error.stack}`);

            return null;
        }
    }
}

module.exports = scraperObject;