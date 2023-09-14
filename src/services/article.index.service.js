const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

const self = module.exports = {
    create: async (item) => {
        let resultVar = 0;

        try {

            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu ArticleIndexes - ${item.Title}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("ArticleId", sql.Int, item.ArticleId)  
                .input("Title", sql.NVarChar(255), item.Title)  
                .input("Bookmark", sql.NVarChar(100), item.Bookmark)  
                .input("Level", sql.TinyInt, item.Level)
                .output('Id', sql.Int)
                    .execute('ArticleIndexes_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error => {
                        console.error(`ArticleIndexes_Insert error => ${error}\n`);
                        logger.error(`ArticleIndexes_Insert create error => ${error}\n`);
                    });
            }
            
        } catch (error) {
            console.error(`article.index.service create error => ${error}\n`);
            logger.error(`article.index.service create error => ${error}\n`);
        }

        return resultVar;
    },
    removeByArticleId: async (articleId) => {
        let resultVar = 'NOK';

        try {

            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Reset dữ liệu ArticleIndexes - ${item.Title}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("ArticleId", sql.Int, articleId)
                .output('ActionStatus', sql.NVarChar(50))
                    .execute('ArticleIndexes_DeleteByArticleId').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error => {
                        console.error(`ArticleIndexes_DeleteByArticleId error => ${error}\n`);
                        logger.error(`ArticleIndexes_DeleteByArticleId error => ${error}\n`);
                    });
            }
            
        } catch (error) {
            console.error(`article.index.service delete by articleId error => ${error}\n`);
            logger.error(`article.index.service delete by articleId error => ${error}\n`);
        }

        return resultVar;
    }
}