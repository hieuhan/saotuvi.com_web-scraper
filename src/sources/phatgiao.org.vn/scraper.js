const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const userAgent = new UserAgent({ deviceCategory: 'desktop' });
const { sleep, urlGetParam, urlSetParam, toSlug, downloadImage, formatDate, strToDate, getFileSize, getDimension } = require('../../utils');
const service = require('../../services');
const logger = require('../../utils/logger');
const SOURCE_DOMAIN = 'https://phatgiao.org.vn/';

const scraperObject = {
    async scraper (browser, pageUrl, categoryName) {
        try {
            
            const page = await this.newPage(browser);

            if(page != null)
            {
                const responseStatus = await this.navigatePage(page, pageUrl);

                if(responseStatus && responseStatus == 200){

                    let currentPage = urlGetParam(pageUrl, 'page');

                    const scrapeCurrentPage = async (pageUrl) => {
                        
                        if(page.isClosed()){
                            return;
                        }

                        console.log(`Truy cập danh sách bài viết - Trang ${ currentPage }  =>\n${pageUrl}\n`);
                        logger.info(`Truy cập danh sách bài viết - Trang ${ currentPage }  =>\n${pageUrl}\n`)

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
                                            Summary: $(summaryElement).children().remove().end().text().trim(),
                                            Url: toSlug(title),
                                            SourceUrl: sourceUrl,
                                            ImagePath: this.getImagePath(imagePath),
                                            ImageName: imageName,
                                            CategoryName: categoryElement.text().trim(),
                                            PublishedAt: strToDate(publishedAtElement.text().trim())
                                        });
                                    }
                                }
                            }
                        }

                        const pagePromise = (article) => new Promise(async (resolve, reject) => {
                            try {
                                
                                const newPage = await this.newPage(browser);

                                if(newPage != null)
                                {
                                    console.log(`Bài viết =>\n${article.SourceUrl}\n`);
        
                                    const responseStatus = await this.navigatePage(newPage, article.SourceUrl);
        
                                    if(responseStatus && responseStatus == 200)
                                    {
                                        const newPageHtml = await newPage.content();
        
                                        const $ = cheerio.load(newPageHtml);
        
                                        await parserData($, pageUrl, article);

                                        await this.closePage(newPage, article.SourceUrl);
        
                                        resolve(true);
                                    }
                                    else
                                    {
                                        console.log(`pagePromise =>\n${pageUrl}\n${article.SourceUrl}\nstatus code => ${responseStatus}`);

                                        await service.crawlFailService.create({
                                            Title: article.Title,
                                            SourceUrl: article.SourceUrl,
                                            Message: responseStatus.toString()
                                        });

                                        reject(false);
                                    }
                                }
                                else
                                {
                                    await service.crawlFailService.create({
                                        Title: article.Title,
                                        SourceUrl: article.SourceUrl,
                                        Message: error.toString()
                                    });
                                    
                                    reject(false);
                                }

                            } catch (error) {

                                console.log(`pagePromise => ${error.name} - ${error.message} - ${error.stack}`);

                                await service.crawlFailService.create({
                                    Title: article.Title,
                                    SourceUrl: article.SourceUrl,
                                    Message: error.toString()
                                });

                                reject(false);
        
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
                        currentPage = urlGetParam(pageUrl, 'page') + 1;

                        const nextPageUrl = urlSetParam(pageUrl, 'page', currentPage);

                        if(nextPageUrl.length > 0){

                            await this.navigatePage(page, nextPageUrl);

                            return scrapeCurrentPage(nextPageUrl);
                        }

                        //đóng page
                        await this.closePage(page, pageUrl);
                    }

                    const parserCategory = async (article) => {
                        let resultVar = 0;
                        try {

                            resultVar = await service.categoryService.create({
                                Name: article.CategoryName,
                                Url: toSlug(article.CategoryName)
                            });

                            await sleep();

                        } catch (error) 
                        {
                            console.log(`parserCategory => ${ article.SourceUrl }\n ${error}`);
                        }
        
                        return resultVar;
                    }

                    const parserCurrentCategory = async (title, articleId) => {
                        let resultVar = 0;
                        try {

                            resultVar = await service.categoryService.create({
                                Name: categoryName,
                                Url: toSlug(categoryName)
                            });

                            if(resultVar > 0){
                                await service.articleCategoryService.create({
                                    Title: title,
                                    ArticleId: articleId,
                                    CategoryId: resultVar
                                });
                            }

                        } catch (error) 
                        {
                            console.log(`parserCategory => ${ categoryName }\n ${error}`);
                        }
        
                        await sleep();

                        return resultVar;
                    }

                    const parserData = async ($, pageUrl, article) => {
                        try {
                            
                            const elementContent = $('.content').first();

                            if(elementContent.length > 0){

                                elementContent.find('.box_ads_inserter').remove();
                                elementContent.find('div[id^="zone-"]').remove();
                                elementContent.find('script').remove();
                                elementContent.find('.audio_box').remove();
                                elementContent.find('.add_end_detail').remove();

                                const categoryId = await parserCategory(article);

                                if(categoryId > 0)
                                {
                                    let articleContent = '', h1TagElement = elementContent.find('h1.main-title.main-title-super').first(),
                                    headTag = $('head'), metaTitleElement = headTag.find('title').first(), metaDescriptionElement = headTag.find('meta[name="description"]').first(),
                                    metaKeywordsElement = headTag.find('meta[name="keywords"]').first(), metaTitle = '', metaDescription = '', metaKeywords = '', h1Tag = '';

                                    const imagePath = await downloadImage(article.ImagePath);

                                    if(typeof imagePath != 'undefined' && imagePath.length > 0 && imagePath != 'error'){

                                        const imagesInContentElement = elementContent.find('img');

                                        let imagesInContent = [], imagesInContentCorrupted = [], headings = [];

                                        //lưu ảnh trong nội dung bài viết
                                        if(imagesInContentElement.length > 0){

                                            console.log(`Xử lý (${ imagesInContentElement.length }) ảnh trong nội dung bài viết ${ article.SourceUrl }\n`);

                                            for await (const img of imagesInContentElement) {

                                                let dataSrc = $(img).attr('data-src'), src = $(img).attr('src');
        
                                                if(typeof dataSrc != 'undefined')
                                                {
                                                    src = dataSrc;

                                                    $(img).removeAttr('data-src');
                                                }
        
                                                if(typeof src != 'undefined')
                                                {
                                                    console.log(`Xử lý ảnh ${ src } trong nội dung bài viết ${ article.SourceUrl }\n`);

                                                    let newSrc = await downloadImage(src);

                                                    await sleep();
        
                                                    if(typeof newSrc != 'undefined' && newSrc.length > 0 && newSrc != 'error')
                                                    {
                                                        newSrc = newSrc.replaceAll('\\','\/');

                                                        $(img).attr('src', newSrc);

                                                        const imageAlt = $(img).attr('alt');

                                                        let imageName = '';

                                                        if(typeof imageAlt != 'undefined' && imageAlt.trim().length > 0 && imageAlt.trim() != 'Empty'){
                                                            imageName = imageAlt.split('.')[0];
                                                        }else{
                                                            imageName = newSrc.split('/').pop();
                                                        }

                                                        if(imageName.length > 250){
                                                            imageName = imageName.substring(0, 250);
                                                        }

                                                        const imageSize = await getFileSize(newSrc);

                                                        const imageDimension = await getDimension(newSrc);
                                                  
                                                        let imageWidth = null, imageHeight = null;

                                                        if(imageDimension != null){

                                                            imageWidth = imageDimension.width;

                                                            imageHeight = imageDimension.height;
                                                        }
                                                        
                                                        imagesInContent.push({
                                                            Name: imageName,
                                                            MediaTypeId: 1,
                                                            FilePath : newSrc,
                                                            FileSize: imageSize,
                                                            Width: imageWidth,
                                                            Height: imageHeight
                                                        });

                                                        await sleep();

                                                    }else{

                                                        imagesInContentCorrupted.push({
                                                            Title: article.Title,
                                                            Source: src
                                                        });

                                                    }
                                                }
                                            }

                                        }

                                        //mục lục
                                        let headers = elementContent.find('h1,h2,h3,h4,h5,h6');
                                        let bookmarks = [];
                                        if(headers.length > 0)
                                        {
                                            for await (const header of headers) {

                                                if($(header).parent('figcaption').length == 0){

                                                    let bookmark = toSlug($(header).text());

                                                    if(bookmarks.indexOf(bookmark) != -1){
                                                        bookmark += '-' + formatDate(new Date());
                                                    }
    
                                                    bookmarks.push(bookmark);
    
                                                    $(header).attr('id', `${ bookmark }`);
    
                                                    headings.push(header);

                                                }
          
                                                //if($(header).parent('figcaption').length == 0)
                                                //{
                                                    // const articleIndexId = await articleIndex.create({
                                                    //     'Title': article.Title,
                                                    //     'ArticleId' :  articleId,
                                                    //     'Title': $(header).text(),
                                                    //     'Bookmark': '#mucluc',
                                                    //     'Level' : parseInt($(header).prop('tagName').substring(1), 10)
                                                    // });

                                                    // if(articleIndexId > 0){

                                                    // }
                                                //}
                                            }
                                        }

                                        //xử lý internal links

                                        const links = elementContent.find('a');
                                        let internalLinks = [], externalLinks = [];

                                        if(links.length > 0){
                                            try {

                                                for await (const link of links) {
                                                    const href = $(link).attr('href');

                                                    if(typeof href != 'undefined' && href.trim().length > 0 && href.trim() != '#' && href.trim() != 'javascript:void(0)'){
                                                        
                                                        if(href.startsWith(SOURCE_DOMAIN)){

                                                            internalLinks.push(href);

                                                        }else{

                                                            externalLinks.push(href);

                                                        }

                                                    }
                                                }

                                            } catch (error) 
                                            {
                                                console.log(`internalLinks => ${ article.SourceUrl }\n ${error}`);
                                            }
                                        }


                                        articleContent = elementContent.html();

                                        const articleId = await service.articleService.create({
                                            Title: article.Title,
                                            Summary: article.Summary,
                                            Url: article.Url,
                                            SourceUrl: article.SourceUrl,
                                            ImagePath: imagePath.replaceAll('\\','\/'),
                                            ArticleContent: articleContent,
                                            CategoryId: categoryId,
                                            ReviewStatusId: 1,
                                            MetaTitle: metaTitle,
                                            MetaDescription: metaDescription,
                                            MetaKeyword: metaKeywords,
                                            H1Tag: h1Tag,
                                            IsIndex: 1,
                                            PublishedAt: article.PublishedAt
                                        });

                                        await sleep();

                                        for await (const image of imagesInContent) {

                                            const mediaId = await service.mediaService.create(image);

                                            if(mediaId > 0){

                                                await service.articleMediaService.create({
                                                    Title: article.Title,
                                                    ArticleId: articleId,
                                                    MediaId: mediaId
                                                });

                                                await sleep();

                                            }
                                        }

                                        if(imagesInContentCorrupted.length > 0){

                                            console.log(`Lưu ${ imagesInContentCorrupted.length } ảnh lỗi trong nội dung bài viết ${ article.SourceUrl }\n`);

                                            for await (const image of imagesInContentCorrupted) {

                                                image.ArticleId = articleId;
    
                                                await service.articleImageFailService.create(image);
    
                                            }

                                        }
                                        

                                        await parserCurrentCategory(article.Title, articleId);

                                        await service.articleCategoryService.create({
                                            Title: article.Title,
                                            ArticleId: articleId,
                                            CategoryId: categoryId
                                        });

                                        await sleep();

                                        const mainImageSize = await getFileSize(imagePath);

                                        const mainImageDimension = await getDimension(imagePath);

                                        let mainImageWidth = null, mainImageHeight = null;

                                        if(mainImageDimension != null){

                                            mainImageWidth = mainImageDimension.width;
                                            mainImageHeight = mainImageDimension.height;

                                        }

                                        const mediaId = await service.mediaService.create({
                                            Name: article.ImageName,
                                            MediaTypeId: 1,
                                            FilePath : imagePath.replaceAll('\\','\/'),
                                            FileSize: mainImageSize,
                                            Width: mainImageWidth,
                                            Height: mainImageHeight,
                                        });

                                        if(mediaId > 0){

                                            await service.articleMediaService.create({
                                                Title: article.Title,
                                                ArticleId: articleId,
                                                MediaId: mediaId
                                            });

                                        }

                                        await sleep();

                                        // const links = elementContent.find('a');
                                        // let internalLinks = [], externalLinks = [];

                                        // if(links.length > 0){
                                        //     for await (const image of imagesInContent) {

                                        //     }
                                        // }
                                    
                                        // Array.from(links).forEach(link => {
                                        //     const href = $(link).attr('href');

                                        //     if(typeof href != 'undefined' && href.trim().length > 0 && href != '#' && href != 'javascript:void(0)'){

                                        //         if(href.startsWith(SOURCE_DOMAIN))
                                        //         {
                                        //             internalLinks.push(href);
                                        //         }else{
                                        //             externalLinks.push(href);
                                        //         }

                                        //     }
                                        // });

                                        for await (const link of internalLinks) {
                                            await service.articleLinkService.create({
                                                Title: article.Title,
                                                ArticleId: articleId,
                                                Url: link,
                                                LinkTypeId: 1
                                            });

                                            await sleep();
                                        }

                                        for await (const link of externalLinks) {
                                            await service.articleLinkService.create({
                                                Title: article.Title,
                                                ArticleId: articleId,
                                                Url: link,
                                                LinkTypeId: 2
                                            });

                                            await sleep();
                                        }

                                        for await (head of headings) {
                                            
                                            await service.articleIndexService.create({
                                                'Title': article.Title,
                                                'ArticleId' :  articleId,
                                                'Title': $(head).text(),
                                                'Bookmark': `#${ $(head).attr('id') }`,
                                                'Level' : parseInt($(head).prop('tagName').substring(1), 10)
                                            });
                                            await sleep();   
                                        }
                                        
                                    }

                                    
                                }

                               
                                //const imagePath = await downloadImage(article.ImagePath);

                                //if(typeof imagePath != 'undefined' && imagePath.length > 0 && imagePath != 'error'){
                                    
                                

                                // const articleId = await articles.create({
                                //     Title: article.Title,
                                //     Summary: article.Title,
                                //     Url: toSlug(article.Title),
                                //     SourceUrl: article.SourceUrl,
                                //     ImagePath: imagePath,
                                //     ArticleContent: articleContent,
                                //     CategoryId: 101,
                                //     ReviewStatusId: 2,
                                //     MetaTitle: metaTitle,
                                //     MetaDescription: metaDescription,
                                //     MetaKeyword: metaKeywords,
                                //     H1Tag: h1Tag
                                // });

                                // if(articleId > 0)
                                // {
                                //     let headers = content.find('h1,h2,h3,h4,h5,h6');

                                    

                                // if(headers.length > 0)
                                // {
                                //     //console.log(headers);
                                //     for await (const header of headers) {
                                //         if($(header).parent('figcaption').length == 0)
                                //         {
                                //             await articleIndex.create({
                                //                 'ArticleTitle': article.Title,
                                //                 'ArticleId' :  articleId,
                                //                 'Title': $(header).text(),
                                //                 'Bookmark': `#mucluc${articleId}`,
                                //                 'Level' : parseInt($(header).prop('tagName').substring(1), 10)
                                //             })
                                //         }
                                //     }
                                // }
                                // }

                                //}else{
                                    //console.log(`Lỗi tải imagePath => ${ article.SourceUrl }\n`);
                                //}
                            }

                        } catch (error) {
                            console.log(`parserData => ${ article.SourceUrl }\n ${error}`);
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

        let page = null;

        try {

            page = await browser.newPage();

            await page.setUserAgent(userAgent.random().toString());

            await page.setRequestInterception(true);

            page.on('request', request => {
                if (!types.includes(request.resourceType()))
                return request.abort();

                request.continue();
            });

        } catch (error) {
            console.log(`newPage => ${error.name} - ${error.message} - ${error.stack}`)
        }

        return page;
    },
    async navigatePage (page, pageUrl){
        let responseStatus; 

        if (!page.isClosed()) {

            await page.goto(`${pageUrl}`, { waitUntil: 'networkidle2' }).then(response => responseStatus = response.status())
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
    getTitle (title) {
        const index = title.indexOf('(');

        if(index != -1)
        {
            title = title.substring(0, index).trim();
        }

        return title;
    },
    getImagePath (path) {
        path = path.replace('/t.ex-cdn.com/' , '/i.ex-cdn.com/');
        path = path.replace(/\/resize\/\d+x\d+\//gm, '/');

        return path;
    },
    generateUUIDUsingMathRandom() { 
        var d = new Date().getTime();//Timestamp
        var d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16;//random number between 0 and 16
            if(d > 0){//Use timestamp until depleted
                r = (d + r)%16 | 0;
                d = Math.floor(d/16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r)%16 | 0;
                d2 = Math.floor(d2/16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
}

module.exports = scraperObject;
