const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

const create = async (item) => {
    let resultVar = 0;
    try {
        
        const pool = await poolPromise;

        if(pool)
        {
            console.log(`Xử lý dữ liệu Bài viết - ${item.Title}\n`);

            await pool.request()  
            .input("ActBy", sql.Int, config.ACTION_BY)  
            .input("Title", sql.NVarChar(500), item.Title)  
            .input("Summary", sql.NVarChar(2000), (item.Summary || null))
            .input("Url", sql.NVarChar(500), item.Url)
            .input("SourceUrl", sql.NVarChar(500), item.SourceUrl)
            .input("ArticleContent", sql.NVarChar(sql.MAX), item.ArticleContent)
            .input("ImagePath", sql.NVarChar(500), (item.ImagePath || null))
            .input("CategoryId", sql.Int, item.CategoryId)
            .input("ReviewStatusId", sql.Int, item.ReviewStatusId)
            .input("MetaTitle", sql.NVarChar(500), (item.MetaTitle || null))
            .input("MetaDescription", sql.NVarChar(500), (item.MetaDescription || null))
            .input("MetaKeyword", sql.NVarChar(255), (item.MetaKeyword || null))
            .input("CanonicalTag", sql.NVarChar(500), (item.CanonicalTag || null))
            .input("H1Tag", sql.NVarChar(255), (item.H1Tag || null))
            .input("SocialTitle", sql.NVarChar(255), (item.SocialTitle || null))
            .input("SocialDescription", sql.NVarChar(255), (item.SocialDescription || null))
            .input("SocialImage", sql.NVarChar(255), (item.SocialImage || null))
            .input("IsIndex", sql.Bit, (item.IsIndex || 1))
            .input("PublishedAt", sql.DateTime, (item.PublishedAt || null))
            .output('Id', sql.Int)
                .execute('Articles_Insert').then(function(recordsets) {
                    const output = (recordsets.output || {});
                    resultVar = output['Id'];
                }).catch(error =>  {
                    console.error(`Articles_Insert error => ${error}\n`);
                    logger.error(`Articles_Insert error => ${error}\n`);
                });
        }
        
    } catch (error) {
        console.error(`article.service create error => ${error}\n`);
        logger.error(`article.service create error => ${error}\n`);
    }
    
    return resultVar;
}

module.exports = {
    create : create
}