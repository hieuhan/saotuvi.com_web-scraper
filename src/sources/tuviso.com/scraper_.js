const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const userAgent = new UserAgent({ deviceCategory: 'desktop' });
const useProxy = require('puppeteer-page-proxy');
const logger = require('../../utils/logger');
const config = require('../../config');
const { crawlDataService } = require('../../services');
const { getParamUrl, setParamUrl, toSlug, stringToDate, sleep } = require('../../utils');
const SOURCE_DOMAIN = 'https://tuviso.com/';
const DATA_SOURCE = 'tuviso.com';

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

                        //logger.info(`Truy cập danh sách bài viết - Trang ${ currentPage }  =>\n${pageUrl}\n`);

                        const pageHtml = await page.content();
        
                        const $ = cheerio.load(pageHtml);

                        let newsItems = [];

                        const firstPostElement = $('.first-post').first();

                        if(firstPostElement.length > 0)
                        {
                            const titleFirstPostElement = $(firstPostElement).find('.first-post-info > a').first(),
                            summaryFirstPostElement = $(firstPostElement).find('.first-post-info p').first(),
                            imageFirstPostElement = $(firstPostElement).find('.first-post-thumbnail img').first();
                            
                            if(titleFirstPostElement.length > 0 &&
                                summaryFirstPostElement.length > 0 &&
                                imageFirstPostElement.length > 0){

                                    const firstPostSourceUrl = titleFirstPostElement.attr('href'), firstPostTitle = this.getTitle(titleFirstPostElement.text().trim()),
                                    firstPostImagePath = imageFirstPostElement.attr('data-src') || imageFirstPostElement.attr('src'),
                                    firstPostImageAlt = imageFirstPostElement.attr('alt');
                                    let firstPostImageName = '';

                                    if(typeof firstPostImageAlt != 'undefined' && firstPostImageAlt.trim().length > 0 && firstPostImageAlt.trim() != 'Empty'){

                                        firstPostImageName = firstPostImageAlt.trim();

                                    }else{

                                        firstPostImageName = firstPostImagePath.split('/').pop().replace('.webp', '');

                                    }

                                    if(typeof firstPostSourceUrl != 'undefined')
                                    {
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

                        if(postsLimitElements.length > 0){

                            for (let index = 0; index < postsLimitElements.length; index++) {
                                const postsLimitElement = postsLimitElements[index],
                                titlePostsLimitElement = $(postsLimitElement).find('.post-carousel-title').first(),
                                imagePostsLimitElement = $(postsLimitElement).find('.post-carousel-thumbnail img').first();

                                if(titlePostsLimitElement.length > 0 &&
                                    imagePostsLimitElement.length > 0){

                                    const postsLimitSourceUrl = titlePostsLimitElement.attr('href'), postsLimitTitle = this.getTitle(titlePostsLimitElement.text().trim()),
                                        postsLimitImagePath = imagePostsLimitElement.attr('data-src') || imagePostsLimitElement.attr('src'),
                                        postsLimitImageAlt = imagePostsLimitElement.attr('alt');
                                        let postsLimitImageName = '';

                                    if(typeof postsLimitImageAlt != 'undefined' && postsLimitImageAlt.trim().length > 0 && postsLimitImageAlt.trim() != 'Empty'){

                                        postsLimitImageName = postsLimitImageAlt.trim();

                                    }else{

                                        postsLimitImageName = postsLimitImagePath.split('/').pop().replace('.webp', '');

                                    }

                                    if(typeof postsLimitSourceUrl != 'undefined')
                                    {
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

                        if(newsItemElements.length > 0)
                        {
                            for (let index = 0; index < newsItemElements.length; index++) {
                                const element = newsItemElements[index],
                                titleElement = $(element).find('.post-archive-title').first(),
                                summaryElement = $(element).find('.post-archive-meta p').first(),
                                imageElement = $(element).find('.post-archive-thumbnail img').first(),
                                categoryElement = $(element).find('.post-archive-category').first();
                                
                                //$(element).addClass('crawled');

                                if(titleElement.length > 0 &&
                                    summaryElement.length > 0 &&
                                    imageElement.length > 0 &&
                                    categoryElement.length > 0) {

                                    const sourceUrl = titleElement.attr('href'), title = this.getTitle(titleElement.text().trim()),
                                    imagePath = imageElement.attr('data-src') || imageElement.attr('src'),
                                    imageAlt = imageElement.attr('alt');
                                    let imageName = '';

                                    if(typeof imageAlt != 'undefined' && imageAlt.trim().length > 0 && imageAlt.trim() != 'Empty'){

                                        imageName = imageAlt.trim();

                                    }else{

                                        imageName = imagePath.split('/').pop().replace('.webp', '');

                                    }

                                    if(typeof sourceUrl != 'undefined')
                                    {
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
                                const $ = cheerio.load(data);

                                const newsItemElements = $('.post-archive');

                                if(newsItemElements.length > 0){

                                }

                                //console.log(newsItemElements.html())
                                //const newPage = await this.newPage(browser);

                                // if(newPage != null)
                                // {
                                //     console.log(`Bài viết =>\n${data.SourceUrl}\n`);
        
                                //     const responseStatus = await this.navigatePage(newPage, data.SourceUrl);
        
                                //     if(responseStatus && responseStatus == 200)
                                //     {
                                //         const newPageHtml = await newPage.content();
        
                                //         const $ = cheerio.load(newPageHtml);
        
                                //         await parserData($, pageUrl, data);

                                //         await this.closePage(newPage, data.SourceUrl);
        
                                //         resolve(true);
                                //     }
                                //     else
                                //     {
                                //         console.log(`pagePromise =>\n${pageUrl}\n${data.SourceUrl}\nstatus code => ${responseStatus}`);

                                //         // logger.error(`pagePromise =>\n${pageUrl}\n${data.SourceUrl}\nstatus code => ${responseStatus}`);

                                //         // await crawlDataService.create({
                                //         //     DataSource: DATA_SOURCE,
                                //         //     DataUrl: data.SourceUrl,
                                //         //     Message: responseStatus + '',
                                //         //     StatusId: 3
                                //         // });

                                //         return reject(false);
                                //     }
                                // }
                                // else
                                // {
                                //     // await crawlDataService.create({
                                //     //     DataSource: DATA_SOURCE,
                                //     //     DataUrl: data.SourceUrl,
                                //     //     StatusId: 3
                                //     // });
                                    
                                //     return reject(false);
                                // }

                            } catch (error) {

                                console.log(`pagePromise => ${error.name} - ${error.message} - ${error.stack}`);

                                // logger.error(`pagePromise => ${error.name} - ${error.message} - ${error.stack}`);

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

                        //   const [response] = await Promise.all([
                        //     page.waitForResponse(x => x.url().incluses('https://tuviso.com/ajax_post', { timeout: 90000 }))
                        //   ])

                        //   var r = await response.json();

                        //console.log(r)

                        // const postResponse = await page.evaluate( async () => {
                        //     const response = await fetch('https://tuviso.com/ajax_post', {
                        //       "headers": {
                        //         "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                        //       },
                        //       "body": `offset=18&category_id=18`,
                        //       "method": "POST"
                        //     });
                        //     const data = response.responseText;
                        //     console.log(data)
                        //     return data;
                        //   });

                        // console.log(postResponse)

                        //console.log(newsItems)
                        //Không có data thì đóng page
                        // if(!Array.isArray(newsItems) || newsItems.length === 0)
                        // {
                        //     //đóng page
                        //     await this.closePage(page, pageUrl);
                        // }
                        // else
                        // {
                        //     for(index in newsItems)
                        //     {
                        //         await pagePromise(newsItems[index]);
                        //     }
                        // }
                        //const button = $('#postMore');
                        //console.log($(button).text().trim());
                        //console.log('click');
                        // await page.evaluate(async () => {
                        //     await new Promise(async (resolve, reject) => {
                                
                        //         const button = document.querySelector('#postMore');
                        //         if (button !== null) {
                                    
                        //           await button.click();
                        //         } else {
                        //           //clearInterval(interval);
                        //           resolve();
                        //         }
                        //     });
                        //   });



                          page.on('response', async response => {

                            if (response.url().includes('https://tuviso.com/ajax_post')) {

                              resp = await response.text();
                              await pagePromise(resp);
                              await page.evaluate(() => window.stop());

                            }

                          })

                          console.log("click view more to load entire list");
                          while (true) {
                              try {



                                
                                  await page.$eval('#postMore', (el) => {
                                          el.scrollIntoView();
                                          el.click();
                                          
                                  });
                                  
                                await page.waitForTimeout(500);
                                console.log("loading...");
                                await sleep();

                                //   const newPageHtml = await page.content();
        
                                //     const $ = cheerio.load(newPageHtml);

                                //     const newsItemElements = $('.main-archive');//.find('.post-archive:not(.crawled)');

                                //     console.log(newsItemElements.html());

                                //     await sleep();

                              } catch (e) {
                                  console.log("done");
                                  break;
                              }
                          }

                        const loadMoreResult = await page.evaluate(() => new Promise(async (resolve, reject) => {
                            //return await isElementVisible(page, '#postMore');
                            const button = document.querySelector('#postMore');
                            const text = button.innerText.trim();
                            if (button !== null) {
                                //console.log('clickViewMoreLoop');
                                //while(text != 'Đã hết dữ liệu !')
                                //{
                                    await button.click();
                                    //await sleep();
                                //}

                                resolve(text)

                            } else {
                                reject(false);
                            }
                        }));

                        //console.log(loadMoreResult)
                        // await page.evaluate(async() => {
                                

                        //     console.log('clickViewMoreLoop');
                        //     const button = document.querySelector('#postMore');

                        //     if (button !== null){

                        //         while($(button).text().trim() != 'Đã hết dữ liệu !'){
                        //             await page.click(button);

                        //             console.log('button click')
                        //         }

                        //     }

                        // })

                        // clickViewMoreLoop_ = async() =>  {
                        //     console.log('clickViewMoreLoop');


                        //     await page.waitForSelector('#postMore', {visible: true})
                            
                        //     console.log('wait');

                        //     const button = await page.$('#postMore');

                        //     await button.click();

                        //     console.log('button click')
                        //     // .then(() => {
                        //     //     console.log("Found the button");
                        //     //     page.click('#postMore')
                        //     // })
                        //     // await page.evaluate(async () => {
                        //     //     await new Promise(async (resolve, reject) => {
                        //     //         console.log('evaluate')
                        //     //       const interval = setInterval(async () => {
                                   
                        //     //         const button = document.querySelector('#postMore');

                        //     //         console.log('click---')
                                    
                        //     //         if (button !== null) {
                        //     //             console.log('click')
                        //     //           button.click();
                        //     //           //await page.click(button)
                        //     //           console.log(11111)
                        //     //     // const newPageHtml = await page.content();
        
                        //     //     // const $ = cheerio.load(newPageHtml);

                        //     //     // const newsItemElements = $('.main-archive').find('.post-archive:not(.crawled)');

                        //     //     // console.log(newsItemElements)
       
                        //     //         } else {

                        //     //           clearInterval(interval);
                                      
                        //     //           resolve();
                        //     //         }
                        //     //       }, 100);
                        //     //     });
                        //     //   });
                        // }

                        //await clickViewMoreLoop();
                         

                        //Lấy dữ liệu page tiếp theo
                        // const pageParam = getParamUrl(pageUrl, 'page');

                        // if(pageParam == null){
                        //     //đóng page
                        //     await this.closePage(page, pageUrl);

                        //     return;
                        // }

                        // currentPage = pageParam + 1;

                        // const nextPageUrl = setParamUrl(pageUrl, 'page', currentPage);

                        // if(nextPageUrl.length > 0){

                        //     await this.navigatePage(page, nextPageUrl);

                        //     return scrapeCurrentPage(nextPageUrl);
                        // }

                        //đóng page
                        await this.closePage(page, pageUrl);
                    }

                    const parserData = async ($, pageUrl, data) => {
                        try {
                            
                            const elementContent = $('#article-content').first();

                            if(elementContent.length > 0){

                                // elementContent.find('.box_ads_inserter').remove();
                                // elementContent.find('div[id^="zone-"]').remove();
                                // elementContent.find('script').remove();
                                // elementContent.find('.audio_box').remove();
                                // elementContent.find('.add_end_detail').remove();
                                const contentElement = $('.text-content'), summaryElement = contentElement.find('.single-des').first(),
                                publishTimeElement = contentElement.find('.single-post-time').first(), mainCategoryElement = contentElement.find('.meta-right a').first();

                                if(summaryElement.length > 0){
                                    if(data.Summary == null){
                                        data.Summary = summaryElement.text().trim();
                                    }
                                }

                                if(publishTimeElement.length > 0){
                                    if(data.PublishedAt == null){
                                        let dateParts = publishTimeElement.text().trim().split(',');
                                        let strDate = dateParts[1].trim().replace('ngày', '');
                                        data.PublishedAt = stringToDate(strDate.trim(), '-');
                                    }
                                }

                                if(mainCategoryElement.length > 0){
                                    if(data.CategoryName == null){
                                        data.CategoryName = mainCategoryElement.text().trim();
                                    }
                                }


                                // await crawlDataService.create({
                                //     DataSource: DATA_SOURCE,
                                //     DataUrl: data.SourceUrl,
                                //     Data: elementContent.html(),
                                //     JSONData: JSON.stringify(data)
                                // });
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
    async newPage (browser, types = ['document', 'xhr', 'fetch', 'script']) {

        try {

            page = await browser.newPage();

            // const proxy = proxies[Math.floor(Math.random() * proxies.length)];

            // console.log(proxy)

            // await useProxy(page, proxy.proxy);

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

            path = path.replace(/-\d+x\d+\.webp/gm, '.webp');

            return path;

        } catch (error) {

            console.error(`getImagePath => ${error.name} - ${error.message} - ${error.stack}`);

            return null;
        }
    }
}

module.exports = scraperObject;