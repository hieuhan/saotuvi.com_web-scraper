const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

const self = module.exports = {
    create: async (item) => {
        let resultVar = 0;

        try {

            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu CrawlFails - ${item.Title}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("Title", sql.NVarChar(500), item.Title)  
                .input("SourceUrl", sql.NVarChar(500), item.SourceUrl)
                .input("Message", sql.NVarChar(2000), (item.Message || null))
                .output('Id', sql.Int)
                    .execute('CrawlFails_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error => {
                        console.error(`CrawlFails_Insert error => ${error}\n`);
                        logger.error(`CrawlFails_Insert error => ${error}\n`);
                    });
            }
            
        } catch (error) {
            console.error(`crawl.fail.service create error => ${error}\n`);
            logger.error(`crawl.fail.service create error => ${error}\n`);
        }

        return resultVar;
    }
}