const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

var self = module.exports = {
    create: async (item) => {
        let resultVar = 0;
        try {

            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu Chuyên mục - ${item.Name}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("Name", sql.NVarChar(250), item.Name)  
                .input("Description", sql.NVarChar(500), (item.Description || null))
                .input("Url", sql.NVarChar(500), item.Url)
                .input("IsActive", sql.Bit, (item.IsActive || 1))
                .output('Id', sql.Int)
                    .execute('Categories_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error =>  {
                        console.error(`Categories_Insert error => ${error}\n`);
                        logger.error(`Categories_Insert error => ${error}\n`);
                    });
            }
            
        } catch (error) {
            console.error(`category.service create error => ${error}\n`);
            logger.error(`category.service create error => ${error}\n`);
        }
        
        return resultVar;
    }
}