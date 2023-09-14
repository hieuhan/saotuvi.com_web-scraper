const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

const self = module.exports = {
    create: async (item) => {
        let resultVar = 0;

        try {
            
            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu ArticleImageErrors - ${item.Title}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("ArticleId", sql.Int, item.ArticleId)  
                .input("Source", sql.NVarChar(250), item.Source)  
                .output('Id', sql.Int)
                    .execute('ArticleImageErrors_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error => {
                        console.error(`ArticleImageErrors_Insert error => ${error}\n`);
                        logger.error(`ArticleImageErrors_Insert error => ${error}\n`);
                    });
            }

        } catch (error) {
            console.error(`article.image.fail.service create error => ${error}\n`);
            logger.error(`article.image.fail.service create error => ${error}\n`);
        }

        return resultVar;
    }
}