const { config, sql, poolPromise } = require('../database/init.mssql');
const logger = require('../utils/logger');

const self = module.exports = {
    create: async (item) => {
        let resultVar = 0;

        try {
            
            const pool = await poolPromise;

            if(pool)
            {
                console.log(`Xử lý dữ liệu Media - ${item.Name}\n`);

                await pool.request()  
                .input("ActBy", sql.Int, config.ACTION_BY)  
                .input("Name", sql.NVarChar(250), item.Name)  
                .input("Description", sql.NVarChar(500), (item.Description || null))
                .input("MediaTypeId", sql.Int, item.MediaTypeId)
                .input("FilePath", sql.NVarChar(500), (item.FilePath || null))
                .input("FileSize", sql.Int, (item.FileSize || null))
                .input("Width", sql.Int, (item.Width || null))
                .input("Height", sql.Int, (item.Height || null))
                .input("EmbedCode", sql.NVarChar(1000), item.EmbedCode)
                .input("HasCopyright", sql.Bit, (item.HasCopyright || null))
                .output('Id', sql.Int)
                    .execute('Medias_Insert').then(function(recordsets) {
                        const output = (recordsets.output || {});
                        resultVar = output['Id'];
                    }).catch(error =>  {
                        console.error(`Medias_Insert error => ${error}\n`);
                        logger.error(`Medias_Insert error => ${error}\n`);
                    });
            }

        } catch (error) {
            console.error(`media.service create error => ${error}\n`);
            logger.error(`media.service create error => ${error}\n`);
        }

        return resultVar;
    }
}