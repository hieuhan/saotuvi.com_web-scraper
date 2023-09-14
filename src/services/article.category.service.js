const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

const self = module.exports = {
    create: async (item) => {
        let resultVar = 0;

        try {
            
            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu ArticleCategories - ${item.Title}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("ArticleId", sql.Int, item.ArticleId)  
                .input("CategoryId", sql.Int, item.CategoryId)
                .output('Id', sql.Int)
                    .execute('ArticleCategories_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error =>  {
                        console.error(`ArticleCategories_Insert error => ${error}\n`);
                        logger.error(`ArticleCategories_Insert error => ${error}\n`);
                    });
            }

        } catch (error) {
            console.error(`article.category.service create error => ${error}\n`);
            logger.error(`article.category.service create error => ${error}\n`);
        }


        return resultVar;
    }
}