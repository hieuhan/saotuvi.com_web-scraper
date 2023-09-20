const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

const self = module.exports = {
    create: async (item) => {
        let resultVar = 0;

        try {

            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu ArticleMedias - ${item.Title}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("ArticleId", sql.Int, item.ArticleId)  
                .input("MediaId", sql.Int, item.MediaId)
                .output('Id', sql.Int)
                    .execute('ArticleMedias_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error =>  {
                        console.error(`ArticleMedias_Insert error => ${error}\n`);
                        logger.error(`ArticleMedias_Insert create error => ${error}\n`);
                    });
            }
            
        } catch (error) {
            console.error(`articleMedia.service create error => ${error}\n`);
            logger.error(`articleMedia.service create error => ${error}\n`);
        }

        return resultVar;
    }
}