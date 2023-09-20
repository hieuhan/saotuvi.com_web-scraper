const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

const self = module.exports = {
    create: async (item) => {
        let resultVar = 0;

        try {
            
            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu ArticleLinks - ${item.Title}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("ArticleId", sql.Int, item.ArticleId)  
                .input("Url", sql.NVarChar(250), item.Url)  
                .input("LinkTypeId", sql.Int, item.LinkTypeId)
                .output('Id', sql.Int)
                    .execute('ArticleLinks_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error =>  {
                        console.error(`ArticleLinks_Insert error => ${error}\n`);
                        logger.error(`ArticleLinks_Insert create error => ${error}\n`);
                    });
            }

        } catch (error) {
            console.error(`articleLink.service create error => ${error}\n`);
            logger.error(`articleLink.service create error => ${error}\n`);
        }

        return resultVar;
    }
}