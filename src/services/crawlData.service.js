const { MAX } = require('mssql');
const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

var self = module.exports = {
    create: async (item) => {
        let resultVar = 0;
        try {

            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu Crawl Data - ${item.DataUrl}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("DataSource", sql.NVarChar(150), item.DataSource)  
                .input("DataUrl", sql.NVarChar(500), item.DataUrl)
                .input("JSONData", sql.NVarChar(2000), (item.JSONData || null))
                .input("Data", sql.NVarChar(MAX), (item.Data || null))
                .input("Message", sql.NVarChar(2000), (item.Message || null))
                .input("StatusId", sql.TinyInt, (item.StatusId || 1))
                .output('Id', sql.Int)
                    .execute('CrawlDatas_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error =>  {
                        console.error(`CrawlDatas_Insert error => ${error}\n`);
                        logger.error(`CrawlDatas_Insert error => ${error}\n`);
                    });
            }
            
        } catch (error) {
            console.error(`crawlData.service create error => ${error}\n`);
            logger.error(`crawlData.service create error => ${error}\n`);
        }
        
        return resultVar;
    }
}